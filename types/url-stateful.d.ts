
export type Listener<T> = (value: T) => void
export type Reader<T> = () => T
export type Writer<T> = (value: T) => void
