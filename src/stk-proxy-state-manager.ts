import type { SubscribeOptions, Subscriber, Subscribers, Unsubscribe } from './types';

export class StkProxyStateManager<State extends object> {
	private readonly _proxyState: State;
	private readonly _subscribers: Subscribers<State> = {};

	constructor(initialState: State) {
		this._proxyState = new Proxy(initialState, {
			set: (target, prop, newValue) => {
				const key = prop as keyof State;

				if (key in target) {
					const currentValue = target[key];
					if (currentValue === newValue) return true;
					const result = Reflect.set(target, prop, newValue);
					this._notify(key);
					return result;
				}

				return false;
			}
		});
	}

	public get state(): Readonly<State> {
		return this._proxyState;
	}

	public get<K extends keyof State>(key: K): State[K] {
		return this._proxyState[key];
	}

	public set<K extends keyof State>(key: K, value: State[K]): void {
		if (key in this._proxyState) {
			this._proxyState[key] = value;
		}
	}

	public update(updater: (prevState: Readonly<State>) => State) {
		const changes = updater(this._proxyState);

		for (const key in changes) {
			if (key in this._proxyState) {
				this.set(key, changes[key]);
			}
		}
	}

	public subscribe<K extends keyof State>(
		key: K,
		callback: Subscriber<State, K>,
		options: Partial<SubscribeOptions> = {}
	): Unsubscribe {
		const { emitImmediately = false } = options;
		const subscribers = this._subscribers[key] ??= [];
		subscribers.push(callback);
		if (emitImmediately) callback(this.get(key));
		return () => {
			const index = subscribers.indexOf(callback);
			if (index >= 0) subscribers?.splice(index, 1);
		};
	}

	private _notify<K extends keyof State>(key: K): void {
		const value = this.get(key);
		this._subscribers[key]?.forEach(cb => cb(value));
	}
}

