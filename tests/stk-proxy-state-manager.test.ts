import { describe, expect, it } from '@rstest/core';

import { StkProxyStateManager } from '../src';

type TestState = {
	count: number;
	name: string;
	active: boolean;
};

type SpyFn<T extends unknown[] = unknown[]> = ((...args: T) => void) & {
	calls: T[];
	callCount: number;
	lastCall: T | undefined;
};

function createSpy<T extends unknown[] = unknown[]>(): SpyFn<T> {
	const calls: T[] = [];
	const fn = (...args: T) => {
		calls.push(args);
	};
	Object.defineProperties(fn, {
		calls: { get: () => calls },
		callCount: { get: () => calls.length },
		lastCall: { get: () => calls[calls.length - 1] }
	});
	return fn as SpyFn<T>;
}

const makeManager = () =>
	new StkProxyStateManager<TestState>({ count: 0, name: 'Alice', active: true });

describe('ProxyStateManager', () => {
	describe('constructor', () => {
		it('создаёт объект с переданным начальным состоянием', () => {
			const manager = makeManager();

			expect(manager.state.count).toBe(0);
			expect(manager.state.name).toBe('Alice');
			expect(manager.state.active).toBe(true);
		});

		it('состояние доступно через ._proxyState (readonly)', () => {
			const manager = makeManager();
			expect(manager.state).toBeDefined();
		});
	});

	describe('get', () => {
		it('возвращает значение по ключу', () => {
			const manager = makeManager();
			expect(manager.get('count')).toBe(0);
			expect(manager.get('name')).toBe('Alice');
		});

		it('возвращает актуальное значение после set()', () => {
			const manager = makeManager();
			manager.set('count', 42);
			expect(manager.get('count')).toBe(42);
		});
	});

	describe('set', () => {
		it('устанавливает значение, get() возвращает новое', () => {
			const manager = makeManager();
			manager.set('name', 'Bob');
			expect(manager.get('name')).toBe('Bob');
		});

		it('не уведомляет подписчиков, если новое значение равно старому', () => {
			const manager = makeManager();
			const cb = createSpy<[number]>();
			manager.subscribe('count', cb);
			manager.set('count', 0);
			expect(cb.callCount).toBe(0);
		});

		it('игнорирует несуществующие ключи, состояние не меняется', () => {
			const manager = makeManager();
			manager.set('unknown' as never, 123 as never);
			expect(manager.get('unknown' as never)).toBeUndefined();
			expect(manager.get('count')).toBe(0);
		});
	});

	describe('update', () => {
		it('применяет изменения из возвращённого объекта', () => {
			const manager = makeManager();
			manager.update(prevState => ({
				...prevState,
				count: 10,
				name: 'Carol'
			}));
			expect(manager.get('count')).toBe(10);
			expect(manager.get('name')).toBe('Carol');
		});

		it('игнорирует ключи, которых нет в начальном состоянии', () => {
			const manager = makeManager();
			manager.update(prevState => ({ ...prevState, count: 5, extra: 'oops' }));
			expect(manager.get('count')).toBe(5);
			expect(manager.get('extra' as never)).toBeUndefined();
		});

		it('уведомляет подписчиков для каждого изменённого ключа', () => {
			const manager = makeManager();
			const cbCount = createSpy<[number]>();
			const cbName = createSpy<[string]>();
			manager.subscribe('count', cbCount);
			manager.subscribe('name', cbName);
			manager.update(prevState => ({
				...prevState,
				count: 7,
				name: 'Dave'
			}));
			expect(cbCount.callCount).toBe(1);
			expect(cbCount.lastCall?.[0]).toBe(7);
			expect(cbName.callCount).toBe(1);
			expect(cbName.lastCall?.[0]).toBe('Dave');
		});
	});

	describe('subscribe', () => {
		it('callback вызывается при изменении подписанного ключа', () => {
			const manager = makeManager();
			const cb = createSpy<[number]>();
			manager.subscribe('count', cb);
			manager.set('count', 5);
			expect(cb.callCount).toBe(1);
			expect(cb.lastCall?.[0]).toBe(5);
		});

		it('callback не вызывается при изменении другого ключа', () => {
			const manager = makeManager();
			const cb = createSpy<[number]>();
			manager.subscribe('count', cb);
			manager.set('name', 'Eve');
			expect(cb.callCount).toBe(0);
		});

		it('callback не вызывается, если новое значение равно старому', () => {
			const manager = makeManager();
			const cb = createSpy<[string]>();
			manager.subscribe('name', cb);
			manager.set('name', 'Alice');
			expect(cb.callCount).toBe(0);
		});
	});

	describe('subscribe с emitImmediately: true', () => {
		it('callback вызывается сразу при подписке с текущим значением', () => {
			const manager = makeManager();
			const cb = createSpy<[number]>();
			manager.subscribe('count', cb, { emitImmediately: true });
			expect(cb.callCount).toBe(1);
			expect(cb.lastCall?.[0]).toBe(0);
		});

		it('после немедленного вызова продолжает подписку на будущие изменения', () => {
			const manager = makeManager();
			const cb = createSpy<[number]>();
			manager.subscribe('count', cb, { emitImmediately: true });
			manager.set('count', 99);
			expect(cb.callCount).toBe(2);
			expect(cb.lastCall?.[0]).toBe(99);
		});
	});

	describe('unsubscribe', () => {
		it('после вызова unsubscribe callback больше не вызывается', () => {
			const manager = makeManager();
			const cb = createSpy<[number]>();
			const unsub = manager.subscribe('count', cb);
			unsub();
			manager.set('count', 10);
			expect(cb.callCount).toBe(0);
		});

		it('повторный вызов unsubscribe безопасен', () => {
			const manager = makeManager();
			const cb = createSpy<[number]>();
			const unsub = manager.subscribe('count', cb);
			expect(() => {
				unsub();
				unsub();
			}).not.toThrow();
		});

		it('другие подписчики на тот же ключ не отписываются', () => {
			const manager = makeManager();
			const cb1 = createSpy<[number]>();
			const cb2 = createSpy<[number]>();
			const unsub1 = manager.subscribe('count', cb1);
			manager.subscribe('count', cb2);
			unsub1();
			manager.set('count', 5);
			expect(cb1.callCount).toBe(0);
			expect(cb2.callCount).toBe(1);
			expect(cb2.lastCall?.[0]).toBe(5);
		});
	});

	describe('несколько подписчиков', () => {
		it('все callbacks уведомляются при изменении одного ключа', () => {
			const manager = makeManager();
			const cb1 = createSpy<[boolean]>();
			const cb2 = createSpy<[boolean]>();
			const cb3 = createSpy<[boolean]>();
			manager.subscribe('active', cb1);
			manager.subscribe('active', cb2);
			manager.subscribe('active', cb3);
			manager.set('active', false);
			expect(cb1.lastCall?.[0]).toBe(false);
			expect(cb2.lastCall?.[0]).toBe(false);
			expect(cb3.lastCall?.[0]).toBe(false);
		});

		it('после отписки одного — остальные продолжают работать', () => {
			const manager = makeManager();
			const cb1 = createSpy<[string]>();
			const cb2 = createSpy<[string]>();
			const unsub1 = manager.subscribe('name', cb1);
			manager.subscribe('name', cb2);
			unsub1();
			manager.set('name', 'Frank');
			expect(cb1.callCount).toBe(0);
			expect(cb2.callCount).toBe(1);
			expect(cb2.lastCall?.[0]).toBe('Frank');
		});
	});

	describe('notify (косвенно через set)', () => {
		it('уведомление происходит после записи нового значения в _proxyState', () => {
			const manager = makeManager();
			let valueAtNotify: number | undefined;
			manager.subscribe('count', () => {
				valueAtNotify = manager.get('count');
			});
			manager.set('count', 42);
			expect(valueAtNotify).toBe(42);
		});
	});
});

