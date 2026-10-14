/**
 * The subset of the Vitest API that {@linkcode defineBrazeSnapshots} registers tests with.
 *
 * Pass the namespace imported from `vitest` or `vite-plus/test`, so the tests
 * run on the same runner instance as the calling test file.
 */
export interface SnapshotTestApi {
  /** Groups the scenarios of one template. */
  describe(name: string, fn: () => void): unknown
  /** Registers one scenario test. */
  test(name: string, fn: () => Promise<void>): unknown
  /** Compares rendered output with a snapshot file. */
  expect(actual: unknown): { toMatchFileSnapshot(file: string): Promise<void> }
  /** Installs the fake clock before the scenarios run. */
  beforeAll(fn: () => void): unknown
  /** Restores the real clock after the scenarios run. */
  afterAll(fn: () => void): unknown
  /** Fake timer controls used to pin `"now"`. */
  vi: {
    useFakeTimers(config: { toFake: 'Date'[] }): unknown
    setSystemTime(time: Date): unknown
    useRealTimers(): unknown
  }
}

/** Options for {@linkcode defineBrazeSnapshots}. */
export interface BrazeSnapshotOptions {
  /** Templates root directory, absolute or relative to the current working directory. */
  root: string
  /**
   * Fixed current time for every scenario, so `"now"` and other date filters render stably.
   *
   * Leave unset to render with the real clock.
   */
  now?: Date | string | number
  /**
   * Snapshot directory, relative to the calling test file.
   *
   * @default '__snapshots__'
   */
  snapshotDir?: string
}
