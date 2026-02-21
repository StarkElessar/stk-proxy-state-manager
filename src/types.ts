export type TypeOrNull<T> = T | null;

export type Unsubscribe = () => void;

export type Subscriber<S extends object, K extends keyof S> = (newVal: S[K]) => void;

export type Subscribers<S extends object> = {
	[K in keyof S]?: Subscriber<S, K>[];
};

export type SubscribeOptions = {
	emitImmediately: boolean;
};

