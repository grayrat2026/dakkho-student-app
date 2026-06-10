var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context2, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context2.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context2, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context2.error = err;
            res = await onError(err, context2);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context2.finalized === false && onNotFound) {
          res = await onNotFound(context2);
        }
      }
      if (res && (context2.finalized === false || isError)) {
        context2.res = res;
      }
      return context2;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context2, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context: context2 }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context2, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env2, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env2, "GET")))();
    }
    const path = this.getPath(request, { env: env2 });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env: env2,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context2 = await composed(c);
        if (!context2.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context2.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context2, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context2.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context2, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _ in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const opts = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: [],
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        if (opts.credentials) {
          return (origin) => origin || null;
        }
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*" || opts.credentials) {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*" || opts.credentials) {
      c.header("Vary", "Origin", { append: true });
    }
  }, "cors2");
}, "cors");

// node_modules/hono/dist/utils/color.js
function getColorEnabled() {
  const { process, Deno } = globalThis;
  const isNoColor = typeof Deno?.noColor === "boolean" ? Deno.noColor : process !== void 0 ? (
    // eslint-disable-next-line no-unsafe-optional-chaining
    "NO_COLOR" in process?.env
  ) : false;
  return !isNoColor;
}
__name(getColorEnabled, "getColorEnabled");
async function getColorEnabledAsync() {
  const { navigator } = globalThis;
  const cfWorkers = "cloudflare:workers";
  const isNoColor = navigator !== void 0 && navigator.userAgent === "Cloudflare-Workers" ? await (async () => {
    try {
      return "NO_COLOR" in ((await import(cfWorkers)).env ?? {});
    } catch {
      return false;
    }
  })() : !getColorEnabled();
  return !isNoColor;
}
__name(getColorEnabledAsync, "getColorEnabledAsync");

// node_modules/hono/dist/middleware/logger/index.js
var humanize = /* @__PURE__ */ __name((times) => {
  const [delimiter, separator] = [",", "."];
  const orderTimes = times.map((v) => v.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + delimiter));
  return orderTimes.join(separator);
}, "humanize");
var time3 = /* @__PURE__ */ __name((start) => {
  const delta = Date.now() - start;
  return humanize([delta < 1e3 ? delta + "ms" : Math.round(delta / 1e3) + "s"]);
}, "time");
var colorStatus = /* @__PURE__ */ __name(async (status) => {
  const colorEnabled = await getColorEnabledAsync();
  if (colorEnabled) {
    switch (status / 100 | 0) {
      case 5:
        return `\x1B[31m${status}\x1B[0m`;
      case 4:
        return `\x1B[33m${status}\x1B[0m`;
      case 3:
        return `\x1B[36m${status}\x1B[0m`;
      case 2:
        return `\x1B[32m${status}\x1B[0m`;
    }
  }
  return `${status}`;
}, "colorStatus");
async function log3(fn, prefix, method, path, status = 0, elapsed) {
  const out = prefix === "<--" ? `${prefix} ${method} ${path}` : `${prefix} ${method} ${path} ${await colorStatus(status)} ${elapsed}`;
  fn(out);
}
__name(log3, "log");
var logger = /* @__PURE__ */ __name((fn = console.log) => {
  return /* @__PURE__ */ __name(async function logger2(c, next) {
    const { method, url } = c.req;
    const path = url.slice(url.indexOf("/", 8));
    await log3(fn, "<--", method, path);
    const start = Date.now();
    await next();
    await log3(fn, "-->", method, path, c.res.status, time3(start));
  }, "logger2");
}, "logger");

// src/lib/auth.ts
async function adminAuthMiddleware(c, next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Authentication required. Provide Authorization: Bearer <token>" }, 401);
  }
  const token = authHeader.substring(7);
  if (!token) {
    return c.json({ error: "Invalid token" }, 401);
  }
  try {
    const session = await c.env.DB.prepare(
      "SELECT id, user_id, email, name, role, expires_at, is_active FROM admin_sessions WHERE id = ? AND is_active = 1"
    ).bind(token).first();
    if (!session) {
      return c.json({ error: "Invalid or expired session" }, 401);
    }
    const expiresAt = new Date(session.expires_at);
    if (expiresAt < /* @__PURE__ */ new Date()) {
      await c.env.DB.prepare(
        "UPDATE admin_sessions SET is_active = 0 WHERE id = ?"
      ).bind(token).run();
      return c.json({ error: "Session expired. Please login again." }, 401);
    }
    c.set("user", {
      id: session.user_id,
      email: session.email,
      name: session.name || "",
      role: session.role
    });
    await next();
  } catch (error3) {
    console.error("Auth middleware error:", error3);
    return c.json({ error: "Authentication failed" }, 401);
  }
}
__name(adminAuthMiddleware, "adminAuthMiddleware");

// src/lib/utils.ts
function generateId() {
  return crypto.randomUUID();
}
__name(generateId, "generateId");
function getErrorMessage(error3) {
  if (error3 instanceof Error) return error3.message;
  if (typeof error3 === "string") return error3;
  return "Unknown error";
}
__name(getErrorMessage, "getErrorMessage");
function getSessionExpiry(days = 7) {
  const expiresAt = /* @__PURE__ */ new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt.toISOString();
}
__name(getSessionExpiry, "getSessionExpiry");

// src/lib/audit.ts
async function logAudit(env2, adminId, action, resourceType, resourceId, details) {
  try {
    await env2.DB.prepare(
      `INSERT INTO audit_logs (id, action, resource_type, resource_id, user_id, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(
      generateId(),
      action,
      resourceType,
      resourceId || null,
      adminId,
      details ? JSON.stringify(details) : "{}"
    ).run();
  } catch (error3) {
    console.error("Audit log failed:", error3);
  }
}
__name(logAudit, "logAudit");

// src/routes/auth.ts
var authRoutes = new Hono2();
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashPassword, "hashPassword");
authRoutes.post("/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }
    const user = await c.env.DB.prepare(
      "SELECT id, email, full_name, role, password_hash, is_active FROM users WHERE email = ? AND is_active = 1"
    ).bind(email).first();
    if (!user) {
      return c.json({ error: "Invalid email or password" }, 401);
    }
    const hashedInput = await hashPassword(password);
    if (hashedInput !== user.password_hash) {
      return c.json({ error: "Invalid email or password" }, 401);
    }
    if (user.role !== "admin") {
      return c.json(
        { error: "Access denied. Admin role required. Your account does not have admin privileges." },
        403
      );
    }
    const expiresAt = getSessionExpiry(7);
    const sessionId = generateId();
    await c.env.DB.prepare(
      "DELETE FROM admin_sessions WHERE user_id = ?"
    ).bind(user.id).run();
    await c.env.DB.prepare(
      `INSERT INTO admin_sessions (id, user_id, email, name, role, ip_address, user_agent, expires_at, is_active)
       VALUES (?, ?, ?, ?, 'admin', ?, ?, ?, 1)`
    ).bind(
      sessionId,
      user.id,
      user.email,
      user.full_name,
      c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown",
      c.req.header("user-agent") || "unknown",
      expiresAt
    ).run();
    return c.json({
      success: true,
      token: sessionId,
      user: { id: user.id, email: user.email, name: user.full_name, role: "admin" }
    });
  } catch (error3) {
    const message = getErrorMessage(error3);
    console.error("Login error:", error3);
    return c.json({ error: message }, 401);
  }
});
authRoutes.post("/check", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ authenticated: false }, 401);
    }
    const token = authHeader.substring(7);
    const session = await c.env.DB.prepare(
      "SELECT id, user_id, email, name, role, expires_at, is_active FROM admin_sessions WHERE id = ? AND is_active = 1"
    ).bind(token).first();
    if (!session || new Date(session.expires_at) < /* @__PURE__ */ new Date()) {
      return c.json({ authenticated: false }, 401);
    }
    return c.json({
      authenticated: true,
      user: { id: session.user_id, email: session.email, name: session.name, role: session.role }
    });
  } catch {
    return c.json({ authenticated: false }, 401);
  }
});
authRoutes.delete("/logout", adminAuthMiddleware, async (c) => {
  try {
    const user = c.get("user");
    await c.env.DB.prepare(
      "UPDATE admin_sessions SET is_active = 0 WHERE user_id = ?"
    ).bind(user.id).run();
    return c.json({ success: true });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
authRoutes.delete("/sessions", adminAuthMiddleware, async (c) => {
  try {
    const result = await c.env.DB.prepare(
      "UPDATE admin_sessions SET is_active = 0 WHERE is_active = 1"
    ).run();
    const user = c.get("user");
    await logAudit(c.env, user.id, "CLEAR_ALL_SESSIONS", "auth", void 0, { action: "clear_all" });
    return c.json({ success: true, cleared: result.meta?.changes || 0 });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
var auth_default = authRoutes;

// src/lib/r2.ts
async function uploadFile(bucket, key, body, contentType) {
  const result = await bucket.put(key, body, {
    httpMetadata: {
      contentType
    }
  });
  return result;
}
__name(uploadFile, "uploadFile");
async function deleteFile(bucket, key) {
  await bucket.delete(key);
}
__name(deleteFile, "deleteFile");
async function checkBucket(bucket) {
  try {
    const result = await bucket.list({ limit: 1 });
    return true;
  } catch {
    return false;
  }
}
__name(checkBucket, "checkBucket");
function getBucketForType(type, env2) {
  switch (type) {
    case "videos":
    case "video":
      return env2.R2_VIDEOS;
    case "thumbnails":
    case "thumbnail":
    case "images":
    case "image":
      return env2.R2_THUMBNAILS;
    case "avatars":
    case "avatar":
      return env2.R2_AVATARS;
    case "resources":
    case "resource":
    case "documents":
    case "document":
      return env2.R2_RESOURCES;
    default:
      return env2.R2_RESOURCES;
  }
}
__name(getBucketForType, "getBucketForType");
function getPublicUrl(env2, bucketType, key) {
  const envAny = env2;
  const publicUrl = envAny.R2_PUBLIC_URL;
  if (publicUrl) {
    return `${publicUrl}/${key}`;
  }
  const bucketName = getBucketName(bucketType);
  const accountId = envAny.R2_ACCOUNT_ID || "pub";
  return `https://${bucketName}.${accountId}.r2.dev/${key}`;
}
__name(getPublicUrl, "getPublicUrl");
function getBucketName(type) {
  switch (type) {
    case "videos":
    case "video":
      return "dakkho-videos";
    case "thumbnails":
    case "thumbnail":
      return "dakkho-thumbnails";
    case "avatars":
    case "avatar":
      return "dakkho-avatars";
    case "resources":
    case "resource":
      return "dakkho-resources";
    default:
      return "dakkho-resources";
  }
}
__name(getBucketName, "getBucketName");

// src/routes/system.ts
var systemRoutes = new Hono2();
systemRoutes.get("/status", async (c) => {
  try {
    const status = {};
    try {
      const result = await c.env.DB.prepare("SELECT 1 as ok").first();
      const tableCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'"
      ).first();
      status.d1 = {
        status: "connected",
        message: `D1 database working (${tableCount?.count || 0} tables)`
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      status.d1 = { status: "error", message: msg };
    }
    status.r2 = {};
    const buckets = {
      videos: { binding: c.env.R2_VIDEOS, name: "dakkho-videos" },
      thumbnails: { binding: c.env.R2_THUMBNAILS, name: "dakkho-thumbnails" },
      avatars: { binding: c.env.R2_AVATARS, name: "dakkho-avatars" },
      resources: { binding: c.env.R2_RESOURCES, name: "dakkho-resources" }
    };
    for (const [name, { binding: binding2, name: bucketName }] of Object.entries(buckets)) {
      try {
        const ok = await checkBucket(binding2);
        status.r2[name] = ok ? { status: "connected", message: `Bucket "${bucketName}" accessible` } : { status: "error", message: `Bucket "${bucketName}" not found or inaccessible` };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        status.r2[name] = { status: "error", message: msg };
      }
    }
    try {
      await c.env.KV_CONFIG.put("_health_check", "ok", { expirationTtl: 60 });
      const val = await c.env.KV_CONFIG.get("_health_check");
      status.kv = val === "ok" ? { status: "connected", message: "Workers KV working" } : { status: "error", message: "KV read/write mismatch" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      status.kv = { status: "error", message: msg };
    }
    try {
      if (c.env.RESEND_API_KEY) {
        status.email = { status: "connected", message: "Resend API key configured" };
      } else {
        status.email = { status: "error", message: "Resend API key not configured" };
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      status.email = { status: "error", message: msg };
    }
    return c.json(status);
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
systemRoutes.post("/api-key", adminAuthMiddleware, async (c) => {
  try {
    const { apiKey } = await c.req.json();
    if (!apiKey) {
      return c.json({ error: "API key is required" }, 400);
    }
    await c.env.KV_CONFIG.put("admin_api_key_override", apiKey);
    const user = c.get("user");
    await logAudit(c.env, user.id, "UPDATE_API_KEY", "system", void 0, {
      keyPrefix: apiKey.substring(0, 20) + "..."
    });
    return c.json({
      success: true,
      message: "API key stored in KV."
    });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
var system_default = systemRoutes;

// src/routes/users.ts
var userRoutes = new Hono2();
userRoutes.use("*", adminAuthMiddleware);
userRoutes.get("/", async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const search = c.req.query("search") || "";
    const role = c.req.query("role") || "";
    const status = c.req.query("status") || "";
    const offset = (page - 1) * limit;
    let where = "WHERE 1=1";
    const params = [];
    if (search) {
      where += " AND full_name LIKE ?";
      params.push(`%${search}%`);
    }
    if (role) {
      where += " AND role = ?";
      params.push(role);
    }
    if (status === "active") {
      where += " AND is_active = 1";
    }
    if (status === "inactive") {
      where += " AND is_active = 0";
    }
    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM users ${where}`
    ).bind(...params).first();
    const total = countResult?.total || 0;
    const result = await c.env.DB.prepare(
      `SELECT id, email, full_name, phone, bio, institute_id, technology, semester, avatar_url, role, email_verified, is_active, enrolled_course_ids, created_at, updated_at FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all();
    return c.json({ documents: result.results, total });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
userRoutes.put("/", async (c) => {
  try {
    const data = await c.req.json();
    const { userId, ...updates } = data;
    if (!userId) {
      return c.json({ error: "User ID required" }, 400);
    }
    const allowedFields = ["full_name", "phone", "bio", "institute_id", "technology", "semester", "avatar_url", "role", "email_verified", "is_active", "enrolled_course_ids"];
    const setClauses = [];
    const setValues = [];
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = ?`);
        setValues.push(value);
      }
    }
    if (setClauses.length === 0) {
      return c.json({ error: "No valid fields to update" }, 400);
    }
    setClauses.push("updated_at = datetime('now')");
    setValues.push(userId);
    await c.env.DB.prepare(
      `UPDATE users SET ${setClauses.join(", ")} WHERE id = ?`
    ).bind(...setValues).run();
    const updatedUser = await c.env.DB.prepare(
      "SELECT id, email, full_name, phone, bio, institute_id, technology, semester, avatar_url, role, email_verified, is_active, enrolled_course_ids, created_at, updated_at FROM users WHERE id = ?"
    ).bind(userId).first();
    const user = c.get("user");
    await logAudit(c.env, user.id, "UPDATE_USER", "users", userId, updates);
    return c.json({ document: updatedUser });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
userRoutes.delete("/", async (c) => {
  try {
    const userId = c.req.query("id");
    if (!userId) {
      return c.json({ error: "User ID required" }, 400);
    }
    await c.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
    const user = c.get("user");
    await logAudit(c.env, user.id, "DELETE_USER", "users", userId);
    return c.json({ success: true });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
var users_default = userRoutes;

// src/routes/categories.ts
var categoryRoutes = new Hono2();
categoryRoutes.use("*", adminAuthMiddleware);
categoryRoutes.get("/", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "50");
    const countResult = await c.env.DB.prepare(
      "SELECT COUNT(*) as total FROM categories"
    ).first();
    const total = countResult?.total || 0;
    const result = await c.env.DB.prepare(
      "SELECT * FROM categories ORDER BY sort_order ASC LIMIT ?"
    ).bind(limit).all();
    return c.json({ documents: result.results, total });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
categoryRoutes.post("/", async (c) => {
  try {
    const data = await c.req.json();
    const id = crypto.randomUUID();
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await c.env.DB.prepare(`
      INSERT INTO categories (id, name, slug, icon, color, parent_id, sort_order, course_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.name || "",
      slug,
      data.icon || null,
      data.color || null,
      data.parent_id || null,
      data.sort_order || 0,
      data.course_count || 0
    ).run();
    const created = await c.env.DB.prepare("SELECT * FROM categories WHERE id = ?").bind(id).first();
    const user = c.get("user");
    await logAudit(c.env, user.id, "CREATE_CATEGORY", "categories", id, data);
    return c.json({ document: created });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
categoryRoutes.put("/", async (c) => {
  try {
    const data = await c.req.json();
    const { categoryId, ...updates } = data;
    if (!categoryId) {
      return c.json({ error: "Category ID required" }, 400);
    }
    const allowedFields = ["name", "slug", "icon", "color", "parent_id", "sort_order", "course_count"];
    const setClauses = [];
    const setValues = [];
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = ?`);
        setValues.push(value);
      }
    }
    if (setClauses.length === 0) {
      return c.json({ error: "No valid fields to update" }, 400);
    }
    setClauses.push("updated_at = datetime('now')");
    setValues.push(String(categoryId));
    await c.env.DB.prepare(
      `UPDATE categories SET ${setClauses.join(", ")} WHERE id = ?`
    ).bind(...setValues).run();
    const updated = await c.env.DB.prepare("SELECT * FROM categories WHERE id = ?").bind(String(categoryId)).first();
    const user = c.get("user");
    await logAudit(c.env, user.id, "UPDATE_CATEGORY", "categories", String(categoryId), updates);
    return c.json({ document: updated });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
categoryRoutes.delete("/", async (c) => {
  try {
    const categoryId = c.req.query("id");
    if (!categoryId) {
      return c.json({ error: "Category ID required" }, 400);
    }
    await c.env.DB.prepare("DELETE FROM categories WHERE id = ?").bind(categoryId).run();
    const user = c.get("user");
    await logAudit(c.env, user.id, "DELETE_CATEGORY", "categories", categoryId);
    return c.json({ success: true });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
var categories_default = categoryRoutes;

// src/routes/instructors.ts
var instructorRoutes = new Hono2();
instructorRoutes.use("*", adminAuthMiddleware);
instructorRoutes.get("/", async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const search = c.req.query("search") || "";
    const offset = (page - 1) * limit;
    let where = "WHERE 1=1";
    const params = [];
    if (search) {
      where += " AND name LIKE ?";
      params.push(`%${search}%`);
    }
    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM instructors ${where}`
    ).bind(...params).first();
    const total = countResult?.total || 0;
    const result = await c.env.DB.prepare(
      `SELECT * FROM instructors ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all();
    return c.json({ documents: result.results, total });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
instructorRoutes.post("/", async (c) => {
  try {
    const data = await c.req.json();
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO instructors (id, name, email, bio, avatar_url, cover_url, specialization, rating, total_students, total_courses, social_links, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.name || "",
      data.email || null,
      data.bio || null,
      data.avatar_url || null,
      data.cover_url || null,
      data.specialization || null,
      data.rating || 0,
      data.total_students || 0,
      data.total_courses || 0,
      data.social_links || "{}",
      data.is_active !== void 0 ? data.is_active ? 1 : 0 : 1
    ).run();
    const created = await c.env.DB.prepare("SELECT * FROM instructors WHERE id = ?").bind(id).first();
    const user = c.get("user");
    await logAudit(c.env, user.id, "CREATE_INSTRUCTOR", "instructors", id, data);
    return c.json({ document: created });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
instructorRoutes.put("/", async (c) => {
  try {
    const data = await c.req.json();
    const { instructorId, ...updates } = data;
    if (!instructorId) {
      return c.json({ error: "Instructor ID required" }, 400);
    }
    const allowedFields = ["name", "email", "bio", "avatar_url", "cover_url", "specialization", "rating", "total_students", "total_courses", "social_links", "is_active"];
    const setClauses = [];
    const setValues = [];
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === "is_active") {
          setClauses.push(`${key} = ?`);
          setValues.push(value ? 1 : 0);
        } else {
          setClauses.push(`${key} = ?`);
          setValues.push(value);
        }
      }
    }
    if (setClauses.length === 0) {
      return c.json({ error: "No valid fields to update" }, 400);
    }
    setClauses.push("updated_at = datetime('now')");
    setValues.push(String(instructorId));
    await c.env.DB.prepare(
      `UPDATE instructors SET ${setClauses.join(", ")} WHERE id = ?`
    ).bind(...setValues).run();
    const updated = await c.env.DB.prepare("SELECT * FROM instructors WHERE id = ?").bind(String(instructorId)).first();
    const user = c.get("user");
    await logAudit(c.env, user.id, "UPDATE_INSTRUCTOR", "instructors", String(instructorId), updates);
    return c.json({ document: updated });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
instructorRoutes.delete("/", async (c) => {
  try {
    const instructorId = c.req.query("id");
    if (!instructorId) {
      return c.json({ error: "Instructor ID required" }, 400);
    }
    await c.env.DB.prepare("DELETE FROM instructors WHERE id = ?").bind(instructorId).run();
    const user = c.get("user");
    await logAudit(c.env, user.id, "DELETE_INSTRUCTOR", "instructors", instructorId);
    return c.json({ success: true });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
var instructors_default = instructorRoutes;

// src/routes/courses.ts
var courseRoutes = new Hono2();
courseRoutes.use("*", adminAuthMiddleware);
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
__name(slugify, "slugify");
courseRoutes.get("/", async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const search = c.req.query("search") || "";
    const level = c.req.query("level") || "";
    const published = c.req.query("published") || "";
    const featured = c.req.query("featured") || "";
    const offset = (page - 1) * limit;
    let where = "WHERE 1=1";
    const params = [];
    if (search) {
      where += " AND title LIKE ?";
      params.push(`%${search}%`);
    }
    if (level) {
      where += " AND level = ?";
      params.push(level);
    }
    if (published === "true") {
      where += " AND is_published = 1";
    }
    if (published === "false") {
      where += " AND is_published = 0";
    }
    if (featured === "true") {
      where += " AND is_featured = 1";
    }
    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM courses ${where}`
    ).bind(...params).first();
    const total = countResult?.total || 0;
    const result = await c.env.DB.prepare(
      `SELECT * FROM courses ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all();
    return c.json({ documents: result.results, total });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
courseRoutes.post("/", async (c) => {
  try {
    const data = await c.req.json();
    const id = crypto.randomUUID();
    const slug = data.slug || slugify(data.title);
    await c.env.DB.prepare(`
      INSERT INTO courses (id, title, slug, description, thumbnail_url, preview_video_url, category_id, instructor_id, technology_id, level, language, duration, total_videos, rating, total_reviews, total_students, price, is_featured, is_published, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.title || "",
      slug,
      data.description || null,
      data.thumbnail_url || null,
      data.preview_video_url || null,
      data.category_id || null,
      data.instructor_id || null,
      data.technology_id || null,
      data.level || "beginner",
      data.language || "bangla",
      data.duration || 0,
      data.total_videos || 0,
      data.rating || 0,
      data.total_reviews || 0,
      data.total_students || 0,
      data.price || 0,
      data.is_featured ? 1 : 0,
      data.is_published ? 1 : 0,
      data.tags || null
    ).run();
    const created = await c.env.DB.prepare("SELECT * FROM courses WHERE id = ?").bind(id).first();
    const user = c.get("user");
    await logAudit(c.env, user.id, "CREATE_COURSE", "courses", id, data);
    return c.json({ document: created });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
courseRoutes.put("/", async (c) => {
  try {
    const data = await c.req.json();
    const { courseId, ...updates } = data;
    if (!courseId) {
      return c.json({ error: "Course ID required" }, 400);
    }
    const allowedFields = ["title", "slug", "description", "thumbnail_url", "preview_video_url", "category_id", "instructor_id", "technology_id", "level", "language", "duration", "total_videos", "rating", "total_reviews", "total_students", "price", "is_featured", "is_published", "tags"];
    const setClauses = [];
    const setValues = [];
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === "is_featured" || key === "is_published") {
          setClauses.push(`${key} = ?`);
          setValues.push(value ? 1 : 0);
        } else {
          setClauses.push(`${key} = ?`);
          setValues.push(value);
        }
      }
    }
    if (setClauses.length === 0) {
      return c.json({ error: "No valid fields to update" }, 400);
    }
    setClauses.push("updated_at = datetime('now')");
    setValues.push(String(courseId));
    await c.env.DB.prepare(
      `UPDATE courses SET ${setClauses.join(", ")} WHERE id = ?`
    ).bind(...setValues).run();
    const updated = await c.env.DB.prepare("SELECT * FROM courses WHERE id = ?").bind(String(courseId)).first();
    const user = c.get("user");
    await logAudit(c.env, user.id, "UPDATE_COURSE", "courses", String(courseId), updates);
    return c.json({ document: updated });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
courseRoutes.delete("/", async (c) => {
  try {
    const courseId = c.req.query("id");
    if (!courseId) {
      return c.json({ error: "Course ID required" }, 400);
    }
    await c.env.DB.prepare("DELETE FROM courses WHERE id = ?").bind(courseId).run();
    const user = c.get("user");
    await logAudit(c.env, user.id, "DELETE_COURSE", "courses", courseId);
    return c.json({ success: true });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
var courses_default = courseRoutes;

// src/routes/videos.ts
var videoRoutes = new Hono2();
videoRoutes.use("*", adminAuthMiddleware);
videoRoutes.get("/", async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const courseId = c.req.query("courseId") || "";
    const published = c.req.query("published") || "";
    const offset = (page - 1) * limit;
    let where = "WHERE 1=1";
    const params = [];
    if (courseId) {
      where += " AND course_id = ?";
      params.push(courseId);
    }
    if (published === "true") {
      where += " AND is_published = 1";
    }
    if (published === "false") {
      where += " AND is_published = 0";
    }
    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM videos ${where}`
    ).bind(...params).first();
    const total = countResult?.total || 0;
    const result = await c.env.DB.prepare(
      `SELECT * FROM videos ${where} ORDER BY course_id, sort_order ASC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all();
    return c.json({ documents: result.results, total });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
videoRoutes.post("/", async (c) => {
  try {
    const data = await c.req.json();
    const id = crypto.randomUUID();
    const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await c.env.DB.prepare(`
      INSERT INTO videos (id, title, slug, description, course_id, video_url, thumbnail_url, duration, sort_order, is_preview, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.title || "",
      slug,
      data.description || null,
      data.course_id || "",
      data.video_url || null,
      data.thumbnail_url || null,
      data.duration || 0,
      data.sort_order || 0,
      data.is_preview ? 1 : 0,
      data.is_published ? 1 : 0
    ).run();
    const created = await c.env.DB.prepare("SELECT * FROM videos WHERE id = ?").bind(id).first();
    const user = c.get("user");
    await logAudit(c.env, user.id, "CREATE_VIDEO", "videos", id, data);
    return c.json({ document: created });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
videoRoutes.put("/", async (c) => {
  try {
    const data = await c.req.json();
    const { videoId, ...updates } = data;
    if (!videoId) {
      return c.json({ error: "Video ID required" }, 400);
    }
    const allowedFields = ["title", "slug", "description", "course_id", "video_url", "thumbnail_url", "duration", "sort_order", "is_preview", "is_published"];
    const setClauses = [];
    const setValues = [];
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === "is_preview" || key === "is_published") {
          setClauses.push(`${key} = ?`);
          setValues.push(value ? 1 : 0);
        } else {
          setClauses.push(`${key} = ?`);
          setValues.push(value);
        }
      }
    }
    if (setClauses.length === 0) {
      return c.json({ error: "No valid fields to update" }, 400);
    }
    setClauses.push("updated_at = datetime('now')");
    setValues.push(String(videoId));
    await c.env.DB.prepare(
      `UPDATE videos SET ${setClauses.join(", ")} WHERE id = ?`
    ).bind(...setValues).run();
    const updated = await c.env.DB.prepare("SELECT * FROM videos WHERE id = ?").bind(String(videoId)).first();
    const user = c.get("user");
    await logAudit(c.env, user.id, "UPDATE_VIDEO", "videos", String(videoId), updates);
    return c.json({ document: updated });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
videoRoutes.delete("/", async (c) => {
  try {
    const videoId = c.req.query("id");
    if (!videoId) {
      return c.json({ error: "Video ID required" }, 400);
    }
    await c.env.DB.prepare("DELETE FROM videos WHERE id = ?").bind(videoId).run();
    const user = c.get("user");
    await logAudit(c.env, user.id, "DELETE_VIDEO", "videos", videoId);
    return c.json({ success: true });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
var videos_default = videoRoutes;

// src/routes/institutes.ts
var instituteRoutes = new Hono2();
instituteRoutes.use("*", adminAuthMiddleware);
instituteRoutes.get("/", async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = (page - 1) * limit;
    const countResult = await c.env.DB.prepare(
      "SELECT COUNT(*) as total FROM institutes"
    ).first();
    const total = countResult?.total || 0;
    const result = await c.env.DB.prepare(
      "SELECT * FROM institutes ORDER BY created_at DESC LIMIT ? OFFSET ?"
    ).bind(limit, offset).all();
    return c.json({ documents: result.results, total });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
instituteRoutes.post("/", async (c) => {
  try {
    const data = await c.req.json();
    await c.env.DB.prepare(`
      INSERT INTO institutes (name, name_bn, division, district, eiin_number, type, is_requested, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.name || "",
      data.name_bn || null,
      data.division || null,
      data.district || null,
      data.eiin_number || null,
      data.type || "polytechnic",
      data.is_requested ? 1 : 0,
      data.is_active !== void 0 ? data.is_active ? 1 : 0 : 1
    ).run();
    const created = await c.env.DB.prepare(
      "SELECT * FROM institutes WHERE rowid = last_insert_rowid()"
    ).first();
    const user = c.get("user");
    await logAudit(c.env, user.id, "CREATE_INSTITUTE", "institutes", String(created?.id), data);
    return c.json({ document: created });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
instituteRoutes.put("/", async (c) => {
  try {
    const data = await c.req.json();
    const { instituteId, ...updates } = data;
    if (!instituteId) {
      return c.json({ error: "Institute ID required" }, 400);
    }
    const allowedFields = ["name", "name_bn", "division", "district", "eiin_number", "type", "is_requested", "requested_by", "approved_by", "approved_at", "is_active"];
    const setClauses = [];
    const setValues = [];
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === "is_requested" || key === "is_active") {
          setClauses.push(`${key} = ?`);
          setValues.push(value ? 1 : 0);
        } else {
          setClauses.push(`${key} = ?`);
          setValues.push(value);
        }
      }
    }
    if (setClauses.length === 0) {
      return c.json({ error: "No valid fields to update" }, 400);
    }
    setClauses.push("updated_at = datetime('now')");
    setValues.push(String(instituteId));
    await c.env.DB.prepare(
      `UPDATE institutes SET ${setClauses.join(", ")} WHERE id = ?`
    ).bind(...setValues).run();
    const updated = await c.env.DB.prepare("SELECT * FROM institutes WHERE id = ?").bind(String(instituteId)).first();
    const user = c.get("user");
    await logAudit(c.env, user.id, "UPDATE_INSTITUTE", "institutes", String(instituteId), updates);
    return c.json({ document: updated });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
instituteRoutes.delete("/", async (c) => {
  try {
    const instituteId = c.req.query("id");
    if (!instituteId) {
      return c.json({ error: "Institute ID required" }, 400);
    }
    await c.env.DB.prepare("DELETE FROM institutes WHERE id = ?").bind(instituteId).run();
    const user = c.get("user");
    await logAudit(c.env, user.id, "DELETE_INSTITUTE", "institutes", instituteId);
    return c.json({ success: true });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
var institutes_default = instituteRoutes;

// src/lib/types.ts
var DEFAULT_CONFIG = {
  featureToggles: {
    downloads: true,
    bookmarks: true,
    certificates: true,
    liveSessions: true,
    achievements: true,
    assignments: true,
    discussions: true,
    community: true,
    leaderboard: true,
    studyGroups: true,
    peerConnections: true,
    feedback: true,
    pricing: true,
    referral: true
  },
  homePageSections: {
    sections: ["hero", "continue-watching", "categories", "new-releases", "live", "trending", "instructors", "leaderboard", "recommended"]
  },
  sidebarVisibility: {
    menu: true,
    departments: true,
    semesters: true,
    exams: true,
    community: true,
    general: true
  },
  bottomNavTabs: {
    tabs: [
      { id: "home", label: "Home", enabled: true, order: 0 },
      { id: "explore", label: "Explore", enabled: true, order: 1 },
      { id: "my-courses", label: "My Courses", enabled: true, order: 2 },
      { id: "watch-history", label: "Watch History", enabled: true, order: 3 },
      { id: "profile", label: "Profile", enabled: true, order: 4 }
    ]
  },
  topBarElements: {
    search: true,
    notifications: true,
    avatar: true,
    hamburger: true
  },
  cardStyle: "glass",
  contentProtection: {
    enabled: true,
    noCopy: true,
    noRightClick: true,
    noScreenshot: true,
    noPrint: true,
    customContextMenu: true,
    watermark: false,
    dragProtection: true
  }
};

// src/routes/config.ts
var configRoutes = new Hono2();
configRoutes.use("*", adminAuthMiddleware);
configRoutes.get("/", async (c) => {
  try {
    const cachedConfig = await c.env.KV_CONFIG.get("server_config", "json");
    if (cachedConfig) {
      return c.json(cachedConfig);
    }
    const { results } = await c.env.DB.prepare(
      "SELECT key, value FROM app_config"
    ).all();
    const configMap = {};
    for (const row of results) {
      try {
        configMap[row.key] = JSON.parse(row.value);
      } catch {
        configMap[row.key] = row.value;
      }
    }
    const config2 = {
      featureToggles: { ...DEFAULT_CONFIG.featureToggles, ...configMap.featureToggles },
      homePageSections: configMap.homePageSections || DEFAULT_CONFIG.homePageSections,
      sidebarVisibility: { ...DEFAULT_CONFIG.sidebarVisibility, ...configMap.sidebarVisibility },
      bottomNavTabs: configMap.bottomNavTabs || DEFAULT_CONFIG.bottomNavTabs,
      topBarElements: { ...DEFAULT_CONFIG.topBarElements, ...configMap.topBarElements },
      cardStyle: configMap.cardStyle || DEFAULT_CONFIG.cardStyle,
      contentProtection: { ...DEFAULT_CONFIG.contentProtection, ...configMap.contentProtection }
    };
    await c.env.KV_CONFIG.put("server_config", JSON.stringify(config2), { expirationTtl: 300 });
    return c.json(config2);
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
configRoutes.put("/", async (c) => {
  try {
    const config2 = await c.req.json();
    const sections = {
      featureToggles: config2.featureToggles,
      homePageSections: config2.homePageSections,
      sidebarVisibility: config2.sidebarVisibility,
      bottomNavTabs: config2.bottomNavTabs,
      topBarElements: config2.topBarElements,
      cardStyle: config2.cardStyle,
      contentProtection: config2.contentProtection
    };
    for (const [key, value] of Object.entries(sections)) {
      await c.env.DB.prepare(
        `INSERT INTO app_config (key, value, updated_at) VALUES (?, ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
      ).bind(key, JSON.stringify(value)).run();
    }
    await c.env.KV_CONFIG.put("server_config", JSON.stringify(config2));
    await c.env.KV_CONFIG.put("config_updated_at", (/* @__PURE__ */ new Date()).toISOString());
    const user = c.get("user");
    await logAudit(c.env, user.id, "UPDATE_CONFIG", "config", void 0, config2);
    return c.json({ success: true, config: config2 });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
configRoutes.put("/reset", async (c) => {
  try {
    const config2 = DEFAULT_CONFIG;
    const sections = {
      featureToggles: config2.featureToggles,
      homePageSections: config2.homePageSections,
      sidebarVisibility: config2.sidebarVisibility,
      bottomNavTabs: config2.bottomNavTabs,
      topBarElements: config2.topBarElements,
      cardStyle: config2.cardStyle,
      contentProtection: config2.contentProtection
    };
    for (const [key, value] of Object.entries(sections)) {
      await c.env.DB.prepare(
        `INSERT INTO app_config (key, value, updated_at) VALUES (?, ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
      ).bind(key, JSON.stringify(value)).run();
    }
    await c.env.KV_CONFIG.put("server_config", JSON.stringify(config2));
    await c.env.KV_CONFIG.put("config_updated_at", (/* @__PURE__ */ new Date()).toISOString());
    const user = c.get("user");
    await logAudit(c.env, user.id, "RESET_CONFIG", "config", void 0, { action: "reset_to_defaults" });
    return c.json({ success: true, config: config2 });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
var config_default = configRoutes;

// src/lib/onesignal.ts
async function sendPushNotification(env2, payload) {
  try {
    const appId = env2.ONE_SIGNAL_APP_ID;
    const restApiKey = env2.ONE_SIGNAL_REST_API_KEY;
    if (!appId || !restApiKey) {
      console.warn("OneSignal not configured \u2014 skipping push notification");
      return { success: false, recipients: 0, errors: ["OneSignal not configured"] };
    }
    const body = {
      app_id: appId,
      headings: { en: payload.title, bn: payload.titleBn || payload.title },
      contents: { en: payload.message, bn: payload.messageBn || payload.message },
      data: payload.data || {}
    };
    if (payload.url) {
      body.url = payload.url;
    }
    if (payload.targetPlayerIds && payload.targetPlayerIds.length > 0) {
      body.include_player_ids = payload.targetPlayerIds;
    } else if (payload.targetSegment) {
      body.included_segments = [payload.targetSegment];
    } else {
      body.included_segments = ["All"];
    }
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${restApiKey}`
      },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    if (response.ok) {
      return {
        success: true,
        recipients: result.recipients || 0,
        errors: result.errors || []
      };
    } else {
      return {
        success: false,
        recipients: 0,
        errors: [result.errors?.[0] || "Unknown OneSignal error"]
      };
    }
  } catch (error3) {
    console.error("OneSignal push error:", error3);
    return {
      success: false,
      recipients: 0,
      errors: [error3 instanceof Error ? error3.message : "Unknown error"]
    };
  }
}
__name(sendPushNotification, "sendPushNotification");
async function getUserPushTokens(env2, userId) {
  try {
    const result = await env2.DB.prepare(
      "SELECT push_token FROM user_push_tokens WHERE user_id = ? AND is_active = 1"
    ).bind(userId).all();
    return result.results.map((row) => row.push_token);
  } catch (error3) {
    console.error("Failed to get user push tokens:", error3);
    return [];
  }
}
__name(getUserPushTokens, "getUserPushTokens");
async function getBatchUserPushTokens(env2, userIds) {
  if (userIds.length === 0) return [];
  try {
    const placeholders = userIds.map(() => "?").join(",");
    const result = await env2.DB.prepare(
      `SELECT DISTINCT push_token FROM user_push_tokens WHERE user_id IN (${placeholders}) AND is_active = 1`
    ).bind(...userIds).all();
    return result.results.map((row) => row.push_token);
  } catch (error3) {
    console.error("Failed to get batch user push tokens:", error3);
    return [];
  }
}
__name(getBatchUserPushTokens, "getBatchUserPushTokens");
async function registerPushToken(env2, userId, pushToken, deviceType, deviceInfo) {
  try {
    await env2.DB.prepare(
      "UPDATE user_push_tokens SET is_active = 1, updated_at = datetime('now') WHERE user_id = ? AND push_token = ?"
    ).bind(userId, pushToken).run();
    await env2.DB.prepare(`
      INSERT INTO user_push_tokens (id, user_id, push_token, device_type, device_info, is_active, created_at)
      SELECT ?, ?, ?, ?, ?, 1, datetime('now')
      WHERE NOT EXISTS (SELECT 1 FROM user_push_tokens WHERE user_id = ? AND push_token = ?)
    `).bind(generateId(), userId, pushToken, deviceType || null, deviceInfo || null, userId, pushToken).run();
  } catch (error3) {
    console.error("Failed to register push token:", error3);
    throw error3;
  }
}
__name(registerPushToken, "registerPushToken");
async function unregisterPushToken(env2, pushToken) {
  try {
    await env2.DB.prepare(
      "UPDATE user_push_tokens SET is_active = 0, updated_at = datetime('now') WHERE push_token = ?"
    ).bind(pushToken).run();
  } catch (error3) {
    console.error("Failed to unregister push token:", error3);
    throw error3;
  }
}
__name(unregisterPushToken, "unregisterPushToken");

// src/routes/notifications.ts
var notificationRoutes = new Hono2();
notificationRoutes.use("*", adminAuthMiddleware);
notificationRoutes.get("/", async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const userId = c.req.query("userId") || "";
    const offset = (page - 1) * limit;
    let where = "WHERE 1=1";
    const params = [];
    if (userId) {
      where += " AND user_id = ?";
      params.push(userId);
    }
    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM notifications ${where}`
    ).bind(...params).first();
    const total = countResult?.total || 0;
    const result = await c.env.DB.prepare(
      `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all();
    const logsResult = await c.env.DB.prepare(
      "SELECT * FROM notification_logs ORDER BY created_at DESC LIMIT ? OFFSET ?"
    ).bind(limit, offset).all();
    const documents = [
      ...result.results.map((row) => ({
        id: row.id,
        title: row.title,
        message: row.message,
        type: row.type || "info",
        userId: row.user_id,
        isRead: !!row.is_read,
        actionUrl: row.action_url,
        createdAt: row.created_at,
        source: "d1"
      })),
      ...logsResult.results.map((row) => ({
        id: `log-${row.id}`,
        title: row.title,
        message: row.message,
        type: row.metadata ? JSON.parse(row.metadata || "{}").notifType || "info" : "info",
        targetType: row.target_type,
        targetId: row.target_id,
        sentCount: row.sent_count,
        failedCount: row.failed_count,
        createdAt: row.created_at,
        source: "log"
      }))
    ];
    documents.sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime());
    return c.json({ documents: documents.slice(0, limit), total: Math.max(total, documents.length) });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
notificationRoutes.post("/", async (c) => {
  try {
    const data = await c.req.json();
    const { title: title2, message, type = "info", targetAll, targetUserId, targetInstitute, actionUrl, ...extraData } = data;
    if (!title2 || !message) {
      return c.json({ error: "Title and message are required" }, 400);
    }
    const created = [];
    let failedCount = 0;
    let targetType = "user";
    let targetId = targetUserId || "";
    if (targetAll) {
      targetType = "all";
      targetId = "all";
      let offset = 0;
      const limit = 100;
      let hasMore = true;
      while (hasMore) {
        const usersResult = await c.env.DB.prepare(
          "SELECT id FROM users WHERE is_active = 1 LIMIT ? OFFSET ?"
        ).bind(limit, offset).all();
        for (const user2 of usersResult.results) {
          try {
            const notifId = crypto.randomUUID();
            await c.env.DB.prepare(`
              INSERT INTO notifications (id, user_id, title, message, type, is_read, action_url)
              VALUES (?, ?, ?, ?, ?, 0, ?)
            `).bind(notifId, user2.id, title2, message, type, actionUrl || null).run();
            created.push({ id: notifId, userId: user2.id });
          } catch (docErr) {
            failedCount++;
            console.error("Failed to create notification for user:", user2.id, getErrorMessage(docErr));
          }
        }
        offset += limit;
        hasMore = usersResult.results.length === limit;
      }
    } else if (targetInstitute) {
      targetType = "institute";
      targetId = targetInstitute;
      const usersResult = await c.env.DB.prepare(
        "SELECT id FROM users WHERE institute_id = ? AND is_active = 1 LIMIT 500"
      ).bind(targetInstitute).all();
      for (const user2 of usersResult.results) {
        try {
          const notifId = crypto.randomUUID();
          await c.env.DB.prepare(`
            INSERT INTO notifications (id, user_id, title, message, type, is_read, action_url)
            VALUES (?, ?, ?, ?, ?, 0, ?)
          `).bind(notifId, user2.id, title2, message, type, actionUrl || null).run();
          created.push({ id: notifId, userId: user2.id });
        } catch (docErr) {
          failedCount++;
          console.error("Failed to create notification for user:", user2.id, getErrorMessage(docErr));
        }
      }
    } else if (targetUserId) {
      try {
        const notifId = crypto.randomUUID();
        await c.env.DB.prepare(`
          INSERT INTO notifications (id, user_id, title, message, type, is_read, action_url)
          VALUES (?, ?, ?, ?, ?, 0, ?)
        `).bind(notifId, targetUserId, title2, message, type, actionUrl || null).run();
        created.push({ id: notifId, userId: targetUserId });
      } catch (docErr) {
        failedCount++;
        console.error("Failed to create notification:", getErrorMessage(docErr));
      }
    } else {
      return c.json({ error: "Specify targetAll, targetUserId, or targetInstitute" }, 400);
    }
    try {
      if (targetAll) {
        await sendPushNotification(c.env, {
          title: title2,
          message,
          targetSegment: "All",
          url: actionUrl || void 0
        });
      } else if (targetUserId) {
        const pushTokens = await getUserPushTokens(c.env, targetUserId);
        if (pushTokens.length > 0) {
          await sendPushNotification(c.env, {
            title: title2,
            message,
            targetPlayerIds: pushTokens,
            url: actionUrl || void 0
          });
        }
      } else if (targetInstitute) {
        await sendPushNotification(c.env, {
          title: title2,
          message,
          targetSegment: "All",
          url: actionUrl || void 0,
          data: { institute: targetInstitute }
        });
      }
    } catch (pushErr) {
      console.error("Push notification failed:", getErrorMessage(pushErr));
    }
    const user = c.get("user");
    const logMetadata = JSON.stringify({ notifType: type, actionUrl: actionUrl || "", ...extraData });
    await c.env.DB.prepare(`
      INSERT INTO notification_logs (type, category, title, message, target_type, target_id, sent_count, failed_count, metadata, created_by)
      VALUES ('in-app', 'targeted', ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title2,
      message,
      targetType,
      targetId,
      created.length,
      failedCount,
      logMetadata,
      user.id
    ).run();
    await logAudit(c.env, user.id, "SEND_NOTIFICATION", "notifications", void 0, {
      targetType,
      targetId,
      targetAll,
      targetUserId,
      targetInstitute,
      sentCount: created.length,
      failedCount
    });
    return c.json({ created, count: created.length, failedCount, logged: true });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
var notifications_default = notificationRoutes;

// src/routes/analytics.ts
var analyticsRoutes = new Hono2();
analyticsRoutes.use("*", adminAuthMiddleware);
analyticsRoutes.get("/", async (c) => {
  try {
    const [
      usersCount,
      coursesCount,
      videosCount,
      enrollmentsCount,
      activeSessions,
      newSignupsToday
    ] = await Promise.all([
      c.env.DB.prepare("SELECT COUNT(*) as total FROM users").first().catch(() => ({ total: 0 })),
      c.env.DB.prepare("SELECT COUNT(*) as total FROM courses").first().catch(() => ({ total: 0 })),
      c.env.DB.prepare("SELECT COUNT(*) as total FROM videos").first().catch(() => ({ total: 0 })),
      c.env.DB.prepare("SELECT COUNT(*) as total FROM enrollments").first().catch(() => ({ total: 0 })),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM admin_sessions WHERE is_active = 1 AND expires_at > datetime('now')").first().catch(() => ({ count: 0 })),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE date(created_at) = date('now')").first().catch(() => ({ count: 0 }))
    ]);
    const stats = {
      totalUsers: usersCount?.total || 0,
      totalCourses: coursesCount?.total || 0,
      totalVideos: videosCount?.total || 0,
      totalEnrollments: enrollmentsCount?.total || 0,
      activeSessions: activeSessions?.count || 0,
      newSignupsToday: newSignupsToday?.count || 0
    };
    const recentEnrollments = await c.env.DB.prepare(
      "SELECT e.*, u.full_name as user_name, c.title as course_title FROM enrollments e LEFT JOIN users u ON e.user_id = u.id LEFT JOIN courses c ON e.course_id = c.id ORDER BY e.created_at DESC LIMIT 10"
    ).all().catch(() => ({ results: [] }));
    const popularCourses = await c.env.DB.prepare(
      "SELECT * FROM courses ORDER BY total_students DESC LIMIT 5"
    ).all().catch(() => ({ results: [] }));
    let recentLogs = [];
    try {
      const logsResult = await c.env.DB.prepare(
        "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10"
      ).all();
      recentLogs = logsResult.results || [];
    } catch {
    }
    return c.json({
      stats,
      recentEnrollments: recentEnrollments.results,
      popularCourses: popularCourses.results,
      recentLogs
    });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
analyticsRoutes.get("/charts", async (c) => {
  try {
    const now = /* @__PURE__ */ new Date();
    const monthNames = [];
    const monthStarts = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthNames.push(d.toLocaleString("en", { month: "short" }));
      monthStarts.push(d.toISOString().split("T")[0]);
    }
    const enrollmentTrend = [];
    for (let i = 0; i < 6; i++) {
      const nextMonth = i < 5 ? monthStarts[i + 1] : now.toISOString().split("T")[0];
      const result = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM enrollments WHERE created_at >= ? AND created_at < ?"
      ).bind(monthStarts[i], nextMonth).first().catch(() => ({ count: 0 }));
      enrollmentTrend.push({
        month: monthNames[i],
        enrollments: result?.count || 0
      });
    }
    const levelResult = await c.env.DB.prepare(
      "SELECT level, COUNT(*) as count FROM courses GROUP BY level"
    ).all().catch(() => ({ results: [] }));
    const levelMap = { beginner: 0, intermediate: 0, advanced: 0, expert: 0 };
    for (const row of levelResult.results) {
      const level = (row.level || "beginner").toLowerCase();
      if (levelMap[level] !== void 0) {
        levelMap[level] = row.count;
      } else {
        levelMap["beginner"] += row.count;
      }
    }
    const courseDistribution = Object.entries(levelMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
    const userGrowth = [];
    let cumulative = 0;
    for (let i = 0; i < 6; i++) {
      const nextMonth = i < 5 ? monthStarts[i + 1] : now.toISOString().split("T")[0];
      const result = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM users WHERE created_at >= ? AND created_at < ?"
      ).bind(monthStarts[i], nextMonth).first().catch(() => ({ count: 0 }));
      cumulative += result?.count || 0;
      userGrowth.push({ month: monthNames[i], users: cumulative });
    }
    const totalBeforeWindow = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM users WHERE created_at < ?`
    ).bind(monthStarts[0]).first().catch(() => ({ count: 0 }));
    const baseline = totalBeforeWindow?.count || 0;
    const userGrowthWithBaseline = [];
    let cum = baseline;
    for (let i = 0; i < 6; i++) {
      const nextMonth = i < 5 ? monthStarts[i + 1] : now.toISOString().split("T")[0];
      const result = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM users WHERE created_at >= ? AND created_at < ?"
      ).bind(monthStarts[i], nextMonth).first().catch(() => ({ count: 0 }));
      cum += result?.count || 0;
      userGrowthWithBaseline.push({ month: monthNames[i], users: cum });
    }
    return c.json({
      enrollmentTrend,
      courseDistribution,
      userGrowth: userGrowthWithBaseline
    });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
var analytics_default = analyticsRoutes;

// src/routes/upload.ts
var uploadRoutes = new Hono2();
uploadRoutes.use("*", adminAuthMiddleware);
uploadRoutes.post("/", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file");
    const bucket = formData.get("bucket");
    const prefix = formData.get("prefix") || "";
    if (!file || !bucket) {
      return c.json({ error: "File and bucket are required" }, 400);
    }
    const arrayBuffer = await file.arrayBuffer();
    const key = prefix ? `${prefix}/${Date.now()}-${file.name}` : `${Date.now()}-${file.name}`;
    const r2Bucket = getBucketForType(bucket, c.env);
    await uploadFile(r2Bucket, key, arrayBuffer, file.type);
    const url = getPublicUrl(c.env, bucket, key);
    const user = c.get("user");
    await logAudit(c.env, user.id, "UPLOAD_FILE", "r2", key, {
      bucket,
      fileName: file.name,
      size: file.size
    });
    return c.json({ url, key, bucket });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
uploadRoutes.delete("/", async (c) => {
  try {
    const bucket = c.req.query("bucket");
    const key = c.req.query("key");
    if (!bucket || !key) {
      return c.json({ error: "Bucket and key are required" }, 400);
    }
    const r2Bucket = getBucketForType(bucket, c.env);
    await deleteFile(r2Bucket, key);
    const user = c.get("user");
    await logAudit(c.env, user.id, "DELETE_FILE", "r2", key, { bucket });
    return c.json({ success: true });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
var upload_default = uploadRoutes;

// src/lib/resend.ts
async function sendEmail(env2, to, subject, html) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env2.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env2.RESEND_FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to send email" }));
    throw new Error(err.message || "Failed to send email");
  }
  return res.json();
}
__name(sendEmail, "sendEmail");
async function sendTestEmail(env2, to) {
  return sendEmail(
    env2,
    to,
    "DAKKHO Admin - Test Email",
    `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6366f1;">DAKKHO Admin Panel</h1>
      <h2>Test Email</h2>
      <p>This is a test email from the DAKKHO Admin Panel (Cloudflare Workers).</p>
      <p>If you received this email, your email configuration is working correctly.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #6b7280; font-size: 12px;">
        Sent from DAKKHO Admin API on Cloudflare Workers<br />
        Timestamp: ${(/* @__PURE__ */ new Date()).toISOString()}
      </p>
    </div>
    `
  );
}
__name(sendTestEmail, "sendTestEmail");

// src/routes/email.ts
var emailRoutes = new Hono2();
emailRoutes.use("*", adminAuthMiddleware);
emailRoutes.post("/test", async (c) => {
  try {
    const { to } = await c.req.json();
    if (!to) {
      return c.json({ error: "Recipient email is required" }, 400);
    }
    const result = await sendTestEmail(c.env, to);
    const user = c.get("user");
    await logAudit(c.env, user.id, "SEND_TEST_EMAIL", "email", void 0, { to });
    return c.json({ success: true, emailId: result.id });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
emailRoutes.post("/custom", async (c) => {
  try {
    const { to, subject, html } = await c.req.json();
    if (!to || !subject || !html) {
      return c.json({ error: "Recipient, subject, and HTML body are required" }, 400);
    }
    const result = await sendEmail(c.env, to, subject, html);
    const user = c.get("user");
    await logAudit(c.env, user.id, "SEND_CUSTOM_EMAIL", "email", void 0, { to, subject });
    return c.json({ success: true, emailId: result.id });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
emailRoutes.post("/template", async (c) => {
  try {
    const { to, templateId, variables } = await c.req.json();
    if (!to || !templateId) {
      return c.json({ error: "Recipient and template ID are required" }, 400);
    }
    return c.json({ success: true, message: "Use /custom endpoint with pre-rendered template HTML" });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
var email_default = emailRoutes;

// src/routes/admin.ts
var adminRoutes = new Hono2();
adminRoutes.use("*", adminAuthMiddleware);
adminRoutes.get("/audit", async (c) => {
  try {
    const limit = Math.min(parseInt(c.req.query("limit") || "20"), 100);
    const offset = parseInt(c.req.query("offset") || "0");
    const action = c.req.query("action");
    let query = "SELECT id, action, resource_type, resource_id, user_id, user_email, details, created_at FROM audit_logs";
    const params = [];
    if (action) {
      query += " WHERE action = ?";
      params.push(action);
    }
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    let countQuery = "SELECT COUNT(*) as total FROM audit_logs";
    const countParams = [];
    if (action) {
      countQuery += " WHERE action = ?";
      countParams.push(action);
    }
    const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first();
    return c.json({
      logs: results,
      total: countResult?.total || 0,
      limit,
      offset
    });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
adminRoutes.delete("/sessions", async (c) => {
  try {
    const user = c.get("user");
    await c.env.DB.prepare(
      "UPDATE admin_sessions SET is_active = 0 WHERE is_active = 1"
    ).run();
    await logAudit(c.env, user.id, "CLEAR_SESSIONS", "admin", void 0, { action: "clear_all" });
    return c.json({ success: true, message: "All sessions cleared" });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
var admin_default = adminRoutes;

// src/routes/coupons.ts
var couponRoutes = new Hono2();
couponRoutes.use("*", adminAuthMiddleware);
couponRoutes.get("/", async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = (page - 1) * limit;
    const activeOnly = c.req.query("active") === "true";
    let query = "SELECT * FROM coupons";
    let countQuery = "SELECT COUNT(*) as total FROM coupons";
    const params = [];
    if (activeOnly) {
      query += " WHERE is_active = 1";
      countQuery += " WHERE is_active = 1";
    }
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;
    const result = await c.env.DB.prepare(query).bind(...params, limit, offset).all();
    return c.json({ coupons: result.results, total });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
couponRoutes.post("/", async (c) => {
  try {
    const data = await c.req.json();
    const { code, discount_type, discount_value, max_discount, min_purchase, usage_limit, per_user_limit, valid_from, valid_until, applicable_courses, applicable_technologies } = data;
    if (!code || !discount_type || !discount_value || !valid_from || !valid_until) {
      return c.json({ error: "code, discount_type, discount_value, valid_from, valid_until required" }, 400);
    }
    const existing = await c.env.DB.prepare("SELECT id FROM coupons WHERE code = ?").bind(code).first();
    if (existing) {
      return c.json({ error: "Coupon code already exists" }, 400);
    }
    const user = c.get("user");
    const result = await c.env.DB.prepare(`
      INSERT INTO coupons (code, discount_type, discount_value, max_discount, min_purchase, usage_limit, per_user_limit, valid_from, valid_until, applicable_courses, applicable_technologies, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).bind(
      code,
      discount_type,
      discount_value,
      max_discount || null,
      min_purchase || 0,
      usage_limit || null,
      per_user_limit || 1,
      valid_from,
      valid_until,
      applicable_courses ? JSON.stringify(applicable_courses) : null,
      applicable_technologies ? JSON.stringify(applicable_technologies) : null,
      user.id
    ).run();
    await logAudit(c.env, user.id, "CREATE_COUPON", "coupons", String(result.meta?.last_row_id), data);
    return c.json({ success: true, message: "Coupon created successfully" });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
couponRoutes.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();
    const user = c.get("user");
    const updates = [];
    const params = [];
    const allowedFields = ["discount_type", "discount_value", "max_discount", "min_purchase", "usage_limit", "per_user_limit", "valid_from", "valid_until", "is_active"];
    for (const field of allowedFields) {
      if (data[field] !== void 0) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    }
    if (data.applicable_courses !== void 0) {
      updates.push("applicable_courses = ?");
      params.push(JSON.stringify(data.applicable_courses));
    }
    if (data.applicable_technologies !== void 0) {
      updates.push("applicable_technologies = ?");
      params.push(JSON.stringify(data.applicable_technologies));
    }
    if (updates.length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }
    updates.push("updated_at = datetime('now')");
    params.push(id);
    await c.env.DB.prepare(
      `UPDATE coupons SET ${updates.join(", ")} WHERE id = ?`
    ).bind(...params).run();
    await logAudit(c.env, user.id, "UPDATE_COUPON", "coupons", id, data);
    return c.json({ success: true });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
couponRoutes.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    await c.env.DB.prepare(
      "UPDATE coupons SET is_active = 0, updated_at = datetime('now') WHERE id = ?"
    ).bind(id).run();
    await logAudit(c.env, user.id, "DEACTIVATE_COUPON", "coupons", id);
    return c.json({ success: true });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
var coupons_default = couponRoutes;

// src/routes/discounts.ts
var discountRoutes = new Hono2();
discountRoutes.use("*", adminAuthMiddleware);
discountRoutes.get("/", async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = (page - 1) * limit;
    const activeOnly = c.req.query("active") === "true";
    let query = "SELECT * FROM discounts";
    let countQuery = "SELECT COUNT(*) as total FROM discounts";
    const params = [];
    if (activeOnly) {
      query += " WHERE is_active = 1";
      countQuery += " WHERE is_active = 1";
    }
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;
    const result = await c.env.DB.prepare(query).bind(...params, limit, offset).all();
    return c.json({ discounts: result.results, total });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
discountRoutes.post("/", async (c) => {
  try {
    const data = await c.req.json();
    const { name, name_bn, description, discount_type, discount_value, applicable_type, applicable_ids, valid_from, valid_until, is_auto_apply } = data;
    if (!name || !discount_type || !discount_value || !applicable_type || !valid_from || !valid_until) {
      return c.json({ error: "name, discount_type, discount_value, applicable_type, valid_from, valid_until required" }, 400);
    }
    const user = c.get("user");
    const result = await c.env.DB.prepare(`
      INSERT INTO discounts (name, name_bn, description, discount_type, discount_value, applicable_type, applicable_ids, valid_from, valid_until, is_auto_apply, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).bind(
      name,
      name_bn || null,
      description || null,
      discount_type,
      discount_value,
      applicable_type,
      applicable_ids ? JSON.stringify(applicable_ids) : null,
      valid_from,
      valid_until,
      is_auto_apply ? 1 : 0,
      user.id
    ).run();
    await logAudit(c.env, user.id, "CREATE_DISCOUNT", "discounts", String(result.meta?.last_row_id), data);
    return c.json({ success: true, message: "Discount created successfully" });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
discountRoutes.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();
    const user = c.get("user");
    const updates = [];
    const params = [];
    const allowedFields = ["name", "name_bn", "description", "discount_type", "discount_value", "applicable_type", "valid_from", "valid_until", "is_auto_apply", "is_active"];
    for (const field of allowedFields) {
      if (data[field] !== void 0) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    }
    if (data.applicable_ids !== void 0) {
      updates.push("applicable_ids = ?");
      params.push(JSON.stringify(data.applicable_ids));
    }
    if (updates.length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }
    updates.push("updated_at = datetime('now')");
    params.push(id);
    await c.env.DB.prepare(
      `UPDATE discounts SET ${updates.join(", ")} WHERE id = ?`
    ).bind(...params).run();
    await logAudit(c.env, user.id, "UPDATE_DISCOUNT", "discounts", id, data);
    return c.json({ success: true });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
discountRoutes.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    await c.env.DB.prepare(
      "UPDATE discounts SET is_active = 0, updated_at = datetime('now') WHERE id = ?"
    ).bind(id).run();
    await logAudit(c.env, user.id, "DEACTIVATE_DISCOUNT", "discounts", id);
    return c.json({ success: true });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
var discounts_default = discountRoutes;

// src/routes/events.ts
var eventRoutes = new Hono2();
eventRoutes.use("*", adminAuthMiddleware);
eventRoutes.get("/", async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = (page - 1) * limit;
    const type = c.req.query("type");
    const activeOnly = c.req.query("active") === "true";
    let query = "SELECT * FROM events";
    let countQuery = "SELECT COUNT(*) as total FROM events";
    const params = [];
    const conditions = [];
    if (type) {
      conditions.push("event_type = ?");
      params.push(type);
    }
    if (activeOnly) {
      conditions.push("is_active = 1");
    }
    if (conditions.length > 0) {
      const whereClause = " WHERE " + conditions.join(" AND ");
      query += whereClause;
      countQuery += whereClause;
    }
    query += " ORDER BY start_date DESC LIMIT ? OFFSET ?";
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;
    const result = await c.env.DB.prepare(query).bind(...params, limit, offset).all();
    return c.json({ events: result.results, total });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
eventRoutes.post("/", async (c) => {
  try {
    const data = await c.req.json();
    const { title: title2, title_bn, description, description_bn, event_type, banner_url, start_date, end_date, is_featured, metadata } = data;
    if (!title2 || !event_type || !start_date) {
      return c.json({ error: "title, event_type, start_date required" }, 400);
    }
    const user = c.get("user");
    const result = await c.env.DB.prepare(`
      INSERT INTO events (title, title_bn, description, description_bn, event_type, banner_url, start_date, end_date, is_featured, metadata, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).bind(
      title2,
      title_bn || null,
      description || null,
      description_bn || null,
      event_type,
      banner_url || null,
      start_date,
      end_date || null,
      is_featured ? 1 : 0,
      metadata ? JSON.stringify(metadata) : "{}",
      user.id
    ).run();
    await logAudit(c.env, user.id, "CREATE_EVENT", "events", String(result.meta?.last_row_id), data);
    return c.json({ success: true, message: "Event created successfully" });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
eventRoutes.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();
    const user = c.get("user");
    const updates = [];
    const params = [];
    const allowedFields = ["title", "title_bn", "description", "description_bn", "event_type", "banner_url", "start_date", "end_date", "is_featured", "is_active"];
    for (const field of allowedFields) {
      if (data[field] !== void 0) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    }
    if (data.metadata !== void 0) {
      updates.push("metadata = ?");
      params.push(JSON.stringify(data.metadata));
    }
    if (updates.length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }
    updates.push("updated_at = datetime('now')");
    params.push(id);
    await c.env.DB.prepare(
      `UPDATE events SET ${updates.join(", ")} WHERE id = ?`
    ).bind(...params).run();
    await logAudit(c.env, user.id, "UPDATE_EVENT", "events", id, data);
    return c.json({ success: true });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
eventRoutes.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    await c.env.DB.prepare(
      "UPDATE events SET is_active = 0, updated_at = datetime('now') WHERE id = ?"
    ).bind(id).run();
    await logAudit(c.env, user.id, "DELETE_EVENT", "events", id);
    return c.json({ success: true });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
eventRoutes.post("/:id/broadcast", async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    const event = await c.env.DB.prepare("SELECT * FROM events WHERE id = ?").bind(id).first();
    if (!event) {
      return c.json({ error: "Event not found" }, 404);
    }
    const e = event;
    const result = await sendPushNotification(c.env, {
      title: e.title,
      titleBn: e.title_bn || e.title,
      message: e.description || "Check out this event!",
      messageBn: e.description_bn || e.description || "\u098F\u0987 \u0987\u09AD\u09C7\u09A8\u09CD\u099F\u099F\u09BF \u09A6\u09C7\u0996\u09C1\u09A8!",
      url: `/events/${id}`
    });
    await c.env.DB.prepare(`
      INSERT INTO notification_logs (type, category, title, message, target_type, sent_count, failed_count, metadata, created_by)
      VALUES ('push', 'event', ?, ?, 'all', ?, ?, ?, ?)
    `).bind(e.title, e.description || "", result.recipients, result.errors.length, JSON.stringify({ event_id: id }), user.id).run();
    await logAudit(c.env, user.id, "BROADCAST_EVENT", "events", id);
    return c.json({ success: result.success, recipients: result.recipients });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
var events_default = eventRoutes;

// src/routes/live-classes.ts
var liveClassRoutes = new Hono2();
liveClassRoutes.use("*", adminAuthMiddleware);
liveClassRoutes.get("/", async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = (page - 1) * limit;
    const status = c.req.query("status");
    let query = "SELECT * FROM live_class_schedules";
    let countQuery = "SELECT COUNT(*) as total FROM live_class_schedules";
    const params = [];
    if (status) {
      query += " WHERE status = ?";
      countQuery += " WHERE status = ?";
      params.push(status);
    }
    query += " ORDER BY scheduled_at DESC LIMIT ? OFFSET ?";
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;
    const result = await c.env.DB.prepare(query).bind(...params, limit, offset).all();
    return c.json({ liveClasses: result.results, total });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
liveClassRoutes.post("/", async (c) => {
  try {
    const data = await c.req.json();
    const { course_id, title: title2, title_bn, description, instructor_id, technology_id, scheduled_at, duration_minutes, meeting_url, platform: platform2 } = data;
    if (!title2 || !scheduled_at) {
      return c.json({ error: "title and scheduled_at required" }, 400);
    }
    const user = c.get("user");
    const result = await c.env.DB.prepare(`
      INSERT INTO live_class_schedules (course_id, title, title_bn, description, instructor_id, technology_id, scheduled_at, duration_minutes, meeting_url, platform, status, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', 1, ?)
    `).bind(
      course_id || null,
      title2,
      title_bn || null,
      description || null,
      instructor_id || null,
      technology_id || null,
      scheduled_at,
      duration_minutes || 60,
      meeting_url || null,
      platform2 || "jitsi",
      user.id
    ).run();
    await logAudit(c.env, user.id, "CREATE_LIVE_CLASS", "live_classes", String(result.meta?.last_row_id), data);
    return c.json({ success: true, message: "Live class scheduled successfully" });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
liveClassRoutes.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();
    const user = c.get("user");
    const updates = [];
    const params = [];
    const allowedFields = ["course_id", "title", "title_bn", "description", "instructor_id", "technology_id", "scheduled_at", "duration_minutes", "meeting_url", "platform", "status", "recording_url", "is_active"];
    for (const field of allowedFields) {
      if (data[field] !== void 0) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    }
    if (updates.length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }
    updates.push("updated_at = datetime('now')");
    params.push(id);
    await c.env.DB.prepare(
      `UPDATE live_class_schedules SET ${updates.join(", ")} WHERE id = ?`
    ).bind(...params).run();
    await logAudit(c.env, user.id, "UPDATE_LIVE_CLASS", "live_classes", id, data);
    return c.json({ success: true });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
liveClassRoutes.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    await c.env.DB.prepare(`
      UPDATE live_class_schedules SET status = 'cancelled', is_active = 0, updated_at = datetime('now') WHERE id = ?
    `).bind(id).run();
    await logAudit(c.env, user.id, "CANCEL_LIVE_CLASS", "live_classes", id);
    return c.json({ success: true });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
var live_classes_default = liveClassRoutes;

// src/routes/payments.ts
var paymentRoutes = new Hono2();
paymentRoutes.use("*", adminAuthMiddleware);
paymentRoutes.get("/", async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = (page - 1) * limit;
    const status = c.req.query("status");
    const gateway = c.req.query("gateway");
    let query = "SELECT * FROM payments";
    let countQuery = "SELECT COUNT(*) as total FROM payments";
    const params = [];
    const conditions = [];
    if (status) {
      conditions.push("status = ?");
      params.push(status);
    }
    if (gateway) {
      conditions.push("gateway = ?");
      params.push(gateway);
    }
    if (conditions.length > 0) {
      const whereClause = " WHERE " + conditions.join(" AND ");
      query += whereClause;
      countQuery += whereClause;
    }
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;
    const result = await c.env.DB.prepare(query).bind(...params, limit, offset).all();
    return c.json({ payments: result.results, total });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
paymentRoutes.put("/:id/verify", async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    const payment = await c.env.DB.prepare("SELECT * FROM payments WHERE id = ?").bind(id).first();
    if (!payment) {
      return c.json({ error: "Payment not found" }, 404);
    }
    const p = payment;
    if (p.status !== "pending") {
      return c.json({ error: "Payment is not in pending status" }, 400);
    }
    await c.env.DB.prepare(`
      UPDATE payments SET status = 'verified', verified_by = ?, verified_at = datetime('now'), updated_at = datetime('now') WHERE id = ?
    `).bind(user.id, id).run();
    if (p.package_id) {
      const pkg = await c.env.DB.prepare("SELECT * FROM course_packages WHERE id = ?").bind(p.package_id).first();
      if (pkg) {
        const pkgData = pkg;
        const expiresAt = new Date(Date.now() + pkgData.duration_months * 30 * 24 * 60 * 60 * 1e3).toISOString();
        await c.env.DB.prepare(`
          INSERT INTO user_packages (user_id, package_id, course_id, package_type, activated_at, expires_at, status)
          VALUES (?, ?, ?, ?, datetime('now'), ?, 'active')
        `).bind(p.user_id, p.package_id, pkgData.course_id, pkgData.package_type, expiresAt).run();
      }
    }
    await logAudit(c.env, user.id, "VERIFY_PAYMENT", "payments", id);
    return c.json({ success: true, message: "Payment verified and package activated" });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
paymentRoutes.put("/:id/reject", async (c) => {
  try {
    const id = c.req.param("id");
    const { reason } = await c.req.json();
    const user = c.get("user");
    const payment = await c.env.DB.prepare("SELECT * FROM payments WHERE id = ?").bind(id).first();
    if (!payment) {
      return c.json({ error: "Payment not found" }, 404);
    }
    await c.env.DB.prepare(`
      UPDATE payments SET status = 'failed', metadata = ?, verified_by = ?, verified_at = datetime('now'), updated_at = datetime('now') WHERE id = ?
    `).bind(JSON.stringify({ rejection_reason: reason || "Rejected by admin" }), user.id, id).run();
    await logAudit(c.env, user.id, "REJECT_PAYMENT", "payments", id, { reason });
    return c.json({ success: true });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
paymentRoutes.put("/:id/refund", async (c) => {
  try {
    const id = c.req.param("id");
    const { reason } = await c.req.json();
    const user = c.get("user");
    await c.env.DB.prepare(`
      UPDATE payments SET status = 'refunded', metadata = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(JSON.stringify({ refund_reason: reason || "Refunded" }), id).run();
    const payment = await c.env.DB.prepare("SELECT user_id, package_id FROM payments WHERE id = ?").bind(id).first();
    if (payment) {
      const p = payment;
      if (p.package_id) {
        await c.env.DB.prepare(`
          UPDATE user_packages SET status = 'cancelled' WHERE user_id = ? AND package_id = ? AND status = 'active'
        `).bind(p.user_id, p.package_id).run();
      }
    }
    await logAudit(c.env, user.id, "REFUND_PAYMENT", "payments", id, { reason });
    return c.json({ success: true });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
paymentRoutes.get("/config", async (c) => {
  try {
    const result = await c.env.DB.prepare("SELECT * FROM payment_config").all();
    return c.json({ configs: result.results });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
paymentRoutes.put("/config/:gateway", async (c) => {
  try {
    const gateway = c.req.param("gateway");
    const data = await c.req.json();
    const user = c.get("user");
    if (!["manual", "sslcommerz", "bkash"].includes(gateway)) {
      return c.json({ error: "Invalid gateway. Use: manual, sslcommerz, bkash" }, 400);
    }
    if (data.is_active === 1) {
      await c.env.DB.prepare("UPDATE payment_config SET is_active = 0").run();
    }
    const updates = [];
    const params = [];
    if (data.is_active !== void 0) {
      updates.push("is_active = ?");
      params.push(data.is_active);
    }
    if (data.config !== void 0) {
      updates.push("config = ?");
      params.push(JSON.stringify(data.config));
    }
    if (data.sandbox_mode !== void 0) {
      updates.push("sandbox_mode = ?");
      params.push(data.sandbox_mode);
    }
    if (data.instructions !== void 0) {
      updates.push("instructions = ?");
      params.push(data.instructions);
    }
    if (data.instructions_bn !== void 0) {
      updates.push("instructions_bn = ?");
      params.push(data.instructions_bn);
    }
    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      params.push(gateway);
      await c.env.DB.prepare(
        `UPDATE payment_config SET ${updates.join(", ")} WHERE gateway = ?`
      ).bind(...params).run();
    }
    await logAudit(c.env, user.id, "UPDATE_PAYMENT_CONFIG", "payment_config", void 0, { gateway, ...data });
    return c.json({ success: true });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
paymentRoutes.get("/config/:gateway/setup-guide", async (c) => {
  const gateway = c.req.param("gateway");
  const guides = {
    manual: {
      title: "Manual Payment Setup Guide",
      titleBn: "\u09AE\u09CD\u09AF\u09BE\u09A8\u09C1\u09AF\u09BC\u09BE\u09B2 \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09B8\u09C7\u099F\u0986\u09AA \u0997\u09BE\u0987\u09A1",
      steps: [
        "Set your bKash/Nagad number in the Instructions field",
        "Students will see these instructions when paying",
        "Students submit Transaction ID after payment",
        "Admin verifies payment manually from the Payments section",
        "Once verified, course access is automatically granted"
      ],
      fields: [
        { key: "instructions", label: "Payment Instructions (English)", type: "textarea" },
        { key: "instructions_bn", label: "Payment Instructions (Bengali)", type: "textarea" }
      ]
    },
    sslcommerz: {
      title: "SSLCommerz Setup Guide",
      titleBn: "SSLCommerz \u09B8\u09C7\u099F\u0986\u09AA \u0997\u09BE\u0987\u09A1",
      steps: [
        "Register at https://developer.sslcommerz.com",
        "Get your Store ID and Store Password",
        "Enter credentials below and save",
        "Switch to Live mode when ready (set sandbox_mode = 0)",
        "Set callback URLs in SSLCommerz dashboard: https://dakkho-admin-api.dakkho-admin.workers.dev/api/payments/sslcommerz/callback"
      ],
      fields: [
        { key: "store_id", label: "Store ID", type: "text" },
        { key: "store_password", label: "Store Password", type: "password" },
        { key: "sandbox_mode", label: "Sandbox Mode", type: "toggle" }
      ]
    },
    bkash: {
      title: "bKash Payment Setup Guide",
      titleBn: "bKash \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09B8\u09C7\u099F\u0986\u09AA \u0997\u09BE\u0987\u09A1",
      steps: [
        "Register at https://merchant.bkash.com",
        "Get Username, Password, App Key, App Secret",
        "Enter credentials below and save",
        "Switch to Live mode when ready",
        "Set callback URL in bKash dashboard: https://dakkho-admin-api.dakkho-admin.workers.dev/api/payments/bkash/callback"
      ],
      fields: [
        { key: "username", label: "Username", type: "text" },
        { key: "password", label: "Password", type: "password" },
        { key: "app_key", label: "App Key", type: "text" },
        { key: "app_secret", label: "App Secret", type: "password" },
        { key: "sandbox_mode", label: "Sandbox Mode", type: "toggle" }
      ]
    }
  };
  const guide = guides[gateway];
  if (!guide) {
    return c.json({ error: "Invalid gateway" }, 400);
  }
  return c.json(guide);
});
var payments_default = paymentRoutes;

// src/routes/institute-requests.ts
var instituteRequestRoutes = new Hono2();
instituteRequestRoutes.use("*", adminAuthMiddleware);
instituteRequestRoutes.get("/", async (c) => {
  try {
    const status = c.req.query("status") || "all";
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = (page - 1) * limit;
    let query = "SELECT * FROM institute_requests";
    let countQuery = "SELECT COUNT(*) as total FROM institute_requests";
    const params = [];
    if (status !== "all") {
      query += " WHERE status = ?";
      countQuery += " WHERE status = ?";
      params.push(status);
    }
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;
    const result = await c.env.DB.prepare(query).bind(...params, limit, offset).all();
    return c.json({ requests: result.results, total });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
instituteRequestRoutes.post("/", async (c) => {
  try {
    const data = await c.req.json();
    const { user_id, user_email, user_name, institute_name, institute_name_bn, division, district } = data;
    if (!user_id || !institute_name) {
      return c.json({ error: "user_id and institute_name are required" }, 400);
    }
    const existing = await c.env.DB.prepare(
      "SELECT id FROM institutes WHERE name = ? AND is_active = 1"
    ).bind(institute_name).first();
    if (existing) {
      return c.json({ error: "This institute already exists in the system" }, 400);
    }
    const pendingRequest = await c.env.DB.prepare(
      "SELECT id FROM institute_requests WHERE institute_name = ? AND status = ?"
    ).bind(institute_name, "pending").first();
    if (pendingRequest) {
      return c.json({ error: "A request for this institute is already pending" }, 400);
    }
    const result = await c.env.DB.prepare(`
      INSERT INTO institute_requests (user_id, user_email, user_name, institute_name, institute_name_bn, division, district, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(user_id, user_email || null, user_name || null, institute_name, institute_name_bn || null, division || null, district || null).run();
    const user = c.get("user");
    await logAudit(c.env, user.id, "CREATE_INSTITUTE_REQUEST", "institute_requests", String(result.meta?.last_row_id), data);
    return c.json({ success: true, message: "Institute request submitted successfully" });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
instituteRequestRoutes.put("/:id/approve", async (c) => {
  try {
    const id = c.req.param("id");
    const admin = c.get("user");
    const request = await c.env.DB.prepare(
      "SELECT * FROM institute_requests WHERE id = ? AND status = ?"
    ).bind(id, "pending").first();
    if (!request) {
      return c.json({ error: "Pending request not found" }, 404);
    }
    const req = request;
    await c.env.DB.prepare(`
      INSERT INTO institutes (name, name_bn, division, district, type, is_requested, requested_by, approved_by, approved_at, is_active)
      VALUES (?, ?, ?, ?, 'polytechnic', 1, ?, ?, datetime('now'), 1)
    `).bind(req.institute_name, req.institute_name_bn, req.division, req.district, req.user_id, admin.id).run();
    await c.env.DB.prepare(`
      UPDATE institute_requests SET status = 'approved', reviewed_by = ?, reviewed_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).bind(admin.id, id).run();
    await logAudit(c.env, admin.id, "APPROVE_INSTITUTE_REQUEST", "institute_requests", id);
    try {
      const tokens = await getUserPushTokens(c.env, req.user_id);
      if (tokens.length > 0) {
        await sendPushNotification(c.env, {
          title: "Institute Request Approved!",
          titleBn: "\u0987\u09A8\u09B8\u09CD\u099F\u09BF\u099F\u09BF\u0989\u099F \u0985\u09A8\u09C1\u09B0\u09CB\u09A7 \u0985\u09A8\u09C1\u09AE\u09CB\u09A6\u09BF\u09A4!",
          message: `Your request for "${req.institute_name}" has been approved.`,
          messageBn: `"${req.institute_name}" \u098F\u09B0 \u099C\u09A8\u09CD\u09AF \u0986\u09AA\u09A8\u09BE\u09B0 \u0985\u09A8\u09C1\u09B0\u09CB\u09A7 \u0985\u09A8\u09C1\u09AE\u09CB\u09A6\u09BF\u09A4 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7\u0964`,
          targetPlayerIds: tokens
        });
      }
    } catch {
    }
    return c.json({ success: true, message: "Institute request approved and added to institutes" });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
instituteRequestRoutes.put("/:id/reject", async (c) => {
  try {
    const id = c.req.param("id");
    const { admin_note } = await c.req.json();
    const admin = c.get("user");
    const request = await c.env.DB.prepare(
      "SELECT * FROM institute_requests WHERE id = ? AND status = ?"
    ).bind(id, "pending").first();
    if (!request) {
      return c.json({ error: "Pending request not found" }, 404);
    }
    const req = request;
    await c.env.DB.prepare(`
      UPDATE institute_requests SET status = 'rejected', admin_note = ?, reviewed_by = ?, reviewed_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).bind(admin_note || null, admin.id, id).run();
    await logAudit(c.env, admin.id, "REJECT_INSTITUTE_REQUEST", "institute_requests", id);
    try {
      const tokens = await getUserPushTokens(c.env, req.user_id);
      if (tokens.length > 0) {
        await sendPushNotification(c.env, {
          title: "Institute Request Update",
          titleBn: "\u0987\u09A8\u09B8\u09CD\u099F\u09BF\u099F\u09BF\u0989\u099F \u0985\u09A8\u09C1\u09B0\u09CB\u09A7 \u0986\u09AA\u09A1\u09C7\u099F",
          message: `Your request for "${req.institute_name}" was not approved. ${admin_note || ""}`,
          messageBn: `"${req.institute_name}" \u098F\u09B0 \u0985\u09A8\u09C1\u09B0\u09CB\u09A7 \u0985\u09A8\u09C1\u09AE\u09CB\u09A6\u09BF\u09A4 \u09B9\u09AF\u09BC\u09A8\u09BF\u0964 ${admin_note || ""}`,
          targetPlayerIds: tokens
        });
      }
    } catch {
    }
    return c.json({ success: true, message: "Institute request rejected" });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
var institute_requests_default = instituteRequestRoutes;

// src/lib/student-auth.ts
async function validateStudentSession(env2, token) {
  try {
    const session = await env2.DB.prepare(
      "SELECT user_id, email, name, expires_at, is_active FROM student_sessions WHERE id = ? AND is_active = 1"
    ).bind(token).first();
    if (!session) {
      return { authorized: false };
    }
    const expiresAt = new Date(session.expires_at);
    if (expiresAt < /* @__PURE__ */ new Date()) {
      await env2.DB.prepare(
        "UPDATE student_sessions SET is_active = 0 WHERE id = ?"
      ).bind(token).run();
      return { authorized: false };
    }
    return {
      authorized: true,
      userId: session.user_id,
      email: session.email,
      name: session.name || void 0
    };
  } catch (error3) {
    console.error("Student session validation error:", error3);
    return { authorized: false };
  }
}
__name(validateStudentSession, "validateStudentSession");
async function createStudentSession(env2, userId, email) {
  const sessionId = generateId();
  const expiresAt = getSessionExpiry(30);
  await env2.DB.prepare(
    `INSERT INTO student_sessions (id, user_id, email, expires_at, is_active, created_at)
     VALUES (?, ?, ?, ?, 1, datetime('now'))`
  ).bind(sessionId, userId, email, expiresAt).run();
  return sessionId;
}
__name(createStudentSession, "createStudentSession");
async function deleteStudentSession(env2, token) {
  try {
    await env2.DB.prepare(
      "UPDATE student_sessions SET is_active = 0 WHERE id = ?"
    ).bind(token).run();
    return true;
  } catch {
    return false;
  }
}
__name(deleteStudentSession, "deleteStudentSession");

// src/lib/student-auth-middleware.ts
async function studentAuthMiddleware(c, next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized \u2014 login required" }, 401);
  }
  const token = authHeader.substring(7);
  const result = await validateStudentSession(c.env, token);
  if (!result.authorized) {
    return c.json({ error: "Session expired \u2014 please login again" }, 401);
  }
  c.set("studentId", result.userId);
  c.set("studentEmail", result.email || "");
  c.set("studentName", result.name || "");
  await next();
}
__name(studentAuthMiddleware, "studentAuthMiddleware");

// src/routes/student-api.ts
var studentApiRoutes = new Hono2();
async function getStudentAuth(c) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { authorized: false };
  }
  const token = authHeader.substring(7);
  const result = await validateStudentSession(c.env, token);
  return result;
}
__name(getStudentAuth, "getStudentAuth");
async function hashPassword2(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashPassword2, "hashPassword");
async function getStudentUserDoc(env2, userId) {
  try {
    const user = await env2.DB.prepare(
      "SELECT * FROM users WHERE id = ?"
    ).bind(userId).first();
    return user;
  } catch {
    return null;
  }
}
__name(getStudentUserDoc, "getStudentUserDoc");
function transformConfigForStudent(config2) {
  return {
    featureToggles: config2.featureToggles,
    homePageSections: config2.homePageSections.sections,
    sidebarVisibility: config2.sidebarVisibility,
    bottomNavTabs: config2.bottomNavTabs.tabs.filter((t) => t.enabled).sort((a, b) => a.order - b.order).map((t) => t.id),
    topBarElements: config2.topBarElements,
    cardStyle: config2.cardStyle,
    contentProtection: config2.contentProtection
  };
}
__name(transformConfigForStudent, "transformConfigForStudent");
studentApiRoutes.get("/config", async (c) => {
  try {
    const cachedConfig = await c.env.KV_CONFIG.get("server_config", "json");
    if (cachedConfig) {
      const config3 = cachedConfig;
      return c.json({ config: transformConfigForStudent(config3) });
    }
    const { results } = await c.env.DB.prepare(
      "SELECT key, value FROM app_config"
    ).all();
    const configMap = {};
    for (const row of results) {
      try {
        configMap[row.key] = JSON.parse(row.value);
      } catch {
        configMap[row.key] = row.value;
      }
    }
    const config2 = {
      featureToggles: { ...DEFAULT_CONFIG.featureToggles, ...configMap.featureToggles },
      homePageSections: configMap.homePageSections || DEFAULT_CONFIG.homePageSections,
      sidebarVisibility: { ...DEFAULT_CONFIG.sidebarVisibility, ...configMap.sidebarVisibility },
      bottomNavTabs: configMap.bottomNavTabs || DEFAULT_CONFIG.bottomNavTabs,
      topBarElements: { ...DEFAULT_CONFIG.topBarElements, ...configMap.topBarElements },
      cardStyle: configMap.cardStyle || DEFAULT_CONFIG.cardStyle,
      contentProtection: { ...DEFAULT_CONFIG.contentProtection, ...configMap.contentProtection }
    };
    await c.env.KV_CONFIG.put("server_config", JSON.stringify(config2), { expirationTtl: 300 });
    return c.json({ config: transformConfigForStudent(config2) });
  } catch (error3) {
    return c.json({ config: transformConfigForStudent(DEFAULT_CONFIG) });
  }
});
studentApiRoutes.get("/config/payment", async (c) => {
  try {
    const result = await c.env.DB.prepare(
      "SELECT id, gateway, is_active, instructions, instructions_bn, sandbox_mode FROM payment_config WHERE is_active = 1"
    ).all();
    return c.json({ paymentConfig: result.results });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.get("/institutes", async (c) => {
  try {
    const division = c.req.query("division");
    const search = c.req.query("search");
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = (page - 1) * limit;
    let query = "SELECT * FROM institutes WHERE is_active = 1";
    let countQuery = "SELECT COUNT(*) as total FROM institutes WHERE is_active = 1";
    const params = [];
    if (division) {
      query += " AND division = ?";
      countQuery += " AND division = ?";
      params.push(division);
    }
    if (search) {
      query += " AND (name LIKE ? OR name_bn LIKE ?)";
      countQuery += " AND (name LIKE ? OR name_bn LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    query += " ORDER BY is_requested ASC, name ASC LIMIT ? OFFSET ?";
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;
    const result = await c.env.DB.prepare(query).bind(...params, limit, offset).all();
    return c.json({ institutes: result.results, total });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.get("/institutes/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await c.env.DB.prepare(
      "SELECT * FROM institutes WHERE id = ? AND is_active = 1"
    ).bind(id).first();
    if (!result) {
      return c.json({ error: "Institute not found" }, 404);
    }
    return c.json({ institute: result });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.get("/technologies", async (c) => {
  try {
    const result = await c.env.DB.prepare(
      "SELECT * FROM technologies WHERE is_active = 1 ORDER BY name ASC"
    ).all();
    return c.json({ technologies: result.results });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.get("/events", async (c) => {
  try {
    const result = await c.env.DB.prepare(
      "SELECT * FROM events WHERE is_active = 1 AND end_date >= date('now') ORDER BY start_date ASC"
    ).all();
    return c.json({ events: result.results });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.get("/live-classes", async (c) => {
  try {
    const result = await c.env.DB.prepare(
      "SELECT * FROM live_class_schedules WHERE is_active = 1 AND status IN ('scheduled', 'live') ORDER BY scheduled_at ASC"
    ).all();
    return c.json({ liveClasses: result.results });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.get("/coupons/validate", async (c) => {
  try {
    const code = c.req.query("code");
    if (!code) {
      return c.json({ error: "Coupon code required" }, 400);
    }
    const coupon = await c.env.DB.prepare(
      "SELECT * FROM coupons WHERE code = ? AND is_active = 1"
    ).bind(code).first();
    if (!coupon) {
      return c.json({ valid: false, error: "Invalid coupon code" }, 404);
    }
    const cp = coupon;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (cp.valid_from > now || cp.valid_until < now) {
      return c.json({ valid: false, error: "Coupon has expired or is not yet active" });
    }
    if (cp.usage_limit && cp.usage_count >= cp.usage_limit) {
      return c.json({ valid: false, error: "Coupon usage limit reached" });
    }
    return c.json({
      valid: true,
      coupon: {
        code: cp.code,
        discount_type: cp.discount_type,
        discount_value: cp.discount_value,
        max_discount: cp.max_discount,
        min_purchase: cp.min_purchase
      }
    });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.get("/course-packages", async (c) => {
  try {
    const courseId = c.req.query("courseId");
    if (!courseId) {
      return c.json({ error: "courseId required" }, 400);
    }
    const result = await c.env.DB.prepare(
      "SELECT * FROM course_packages WHERE course_id = ? AND is_active = 1 ORDER BY price ASC"
    ).bind(courseId).all();
    return c.json({ packages: result.results });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.get("/courses", async (c) => {
  try {
    const technology = c.req.query("technology") || "";
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = parseInt(c.req.query("offset") || "0");
    const search = c.req.query("search") || "";
    const level = c.req.query("level") || "";
    let where = "WHERE is_published = 1";
    const params = [];
    if (technology) {
      where += " AND technology_id = ?";
      params.push(technology);
    }
    if (search) {
      where += " AND title LIKE ?";
      params.push(`%${search}%`);
    }
    if (level) {
      where += " AND level = ?";
      params.push(level);
    }
    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM courses ${where}`
    ).bind(...params).first();
    const total = countResult?.total || 0;
    const result = await c.env.DB.prepare(
      `SELECT * FROM courses ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all();
    return c.json({ courses: result.results, total });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.get("/courses/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const course = await c.env.DB.prepare(
      "SELECT * FROM courses WHERE id = ? AND is_published = 1"
    ).bind(id).first();
    if (!course) {
      return c.json({ error: "Course not found" }, 404);
    }
    return c.json({ course });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.get("/courses/:id/videos", async (c) => {
  try {
    const id = c.req.param("id");
    const limit = parseInt(c.req.query("limit") || "100");
    const offset = parseInt(c.req.query("offset") || "0");
    const countResult = await c.env.DB.prepare(
      "SELECT COUNT(*) as total FROM videos WHERE course_id = ?"
    ).bind(id).first();
    const total = countResult?.total || 0;
    const result = await c.env.DB.prepare(
      "SELECT * FROM videos WHERE course_id = ? ORDER BY sort_order ASC LIMIT ? OFFSET ?"
    ).bind(id, limit, offset).all();
    return c.json({ videos: result.results, total });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.get("/instructors", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = parseInt(c.req.query("offset") || "0");
    const search = c.req.query("search") || "";
    let where = "WHERE is_active = 1";
    const params = [];
    if (search) {
      where += " AND name LIKE ?";
      params.push(`%${search}%`);
    }
    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM instructors ${where}`
    ).bind(...params).first();
    const total = countResult?.total || 0;
    const result = await c.env.DB.prepare(
      `SELECT * FROM instructors ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all();
    return c.json({ instructors: result.results, total });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.get("/instructors/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const instructor = await c.env.DB.prepare(
      "SELECT * FROM instructors WHERE id = ? AND is_active = 1"
    ).bind(id).first();
    if (!instructor) {
      return c.json({ error: "Instructor not found" }, 404);
    }
    return c.json({ instructor });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.get("/video/stream-url", async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: "Unauthorized \u2014 login required to stream videos" }, 401);
    }
    const key = c.req.query("key");
    const bucket = c.req.query("bucket") || "videos";
    if (!key) {
      return c.json({ error: "key parameter required" }, 400);
    }
    const r2Bucket = getBucketForType(bucket, c.env);
    const fileInfo = await r2Bucket.head(key);
    if (!fileInfo) {
      return c.json({ error: "Video not found" }, 404);
    }
    const url = getPublicUrl(c.env, bucket, key);
    return c.json({ url });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.post("/auth/signup", async (c) => {
  try {
    const { fullName, email, password, instituteId, technology } = await c.req.json();
    if (!fullName || !email || !password) {
      return c.json({ error: "fullName, email, and password are required" }, 400);
    }
    if (password.length < 8) {
      return c.json({ error: "Password must be at least 8 characters" }, 400);
    }
    const existing = await c.env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).bind(email).first();
    if (existing) {
      return c.json({ error: "An account with this email already exists" }, 400);
    }
    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword2(password);
    await c.env.DB.prepare(`
      INSERT INTO users (id, email, full_name, institute_id, technology, role, email_verified, is_active, enrolled_course_ids, password_hash)
      VALUES (?, ?, ?, ?, ?, 'student', 0, 1, '[]', ?)
    `).bind(userId, email, fullName, instituteId || null, technology || null, passwordHash).run();
    const token = await createStudentSession(c.env, userId, email);
    return c.json({
      success: true,
      token,
      userId,
      user: {
        id: userId,
        name: fullName,
        email,
        instituteId: instituteId || null,
        technology: technology || null,
        emailVerified: false,
        packages: []
      }
    });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.post("/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }
    const user = await c.env.DB.prepare(
      "SELECT id, email, full_name, role, password_hash, institute_id, technology, email_verified, is_active FROM users WHERE email = ? AND is_active = 1"
    ).bind(email).first();
    if (!user) {
      return c.json({ error: "Invalid email or password" }, 401);
    }
    const hashedInput = await hashPassword2(password);
    if (hashedInput !== user.password_hash) {
      return c.json({ error: "Invalid email or password" }, 401);
    }
    if (user.role === "admin") {
      return c.json({ error: "Admin accounts cannot login here. Use the admin panel." }, 403);
    }
    let userPackages = [];
    try {
      const pkgResult = await c.env.DB.prepare(
        "SELECT up.*, cp.package_type, cp.price, cp.duration_months FROM user_packages up JOIN course_packages cp ON up.package_id = cp.id WHERE up.user_id = ? AND up.status = 'active' ORDER BY up.activated_at DESC"
      ).bind(user.id).all();
      userPackages = pkgResult.results;
    } catch {
    }
    await c.env.DB.prepare("DELETE FROM student_sessions WHERE user_id = ?").bind(user.id).run();
    const token = await createStudentSession(c.env, user.id, user.email);
    return c.json({
      success: true,
      token,
      userId: user.id,
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        instituteId: user.institute_id || null,
        technology: user.technology || null,
        emailVerified: !!user.email_verified,
        packages: userPackages
      }
    });
  } catch (error3) {
    const msg = getErrorMessage(error3);
    return c.json({ error: msg.includes("Invalid") ? msg : "Invalid email or password" }, 401);
  }
});
studentApiRoutes.post("/auth/logout", async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ success: true });
    }
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.substring(7) || "";
    await deleteStudentSession(c.env, token);
    return c.json({ success: true });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.get("/auth/me", async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const userDoc = await getStudentUserDoc(c.env, auth.userId);
    let userPackages = [];
    try {
      const pkgResult = await c.env.DB.prepare(
        "SELECT up.*, cp.package_type, cp.price, cp.duration_months FROM user_packages up JOIN course_packages cp ON up.package_id = cp.id WHERE up.user_id = ? AND up.status = 'active' ORDER BY up.activated_at DESC"
      ).bind(auth.userId).all();
      userPackages = pkgResult.results;
    } catch {
    }
    const u = userDoc;
    return c.json({
      user: {
        id: auth.userId,
        name: u?.full_name || auth.name || "",
        email: auth.email || u?.email || "",
        instituteId: u?.institute_id || null,
        technology: u?.technology || null,
        emailVerified: !!u?.email_verified,
        avatarUrl: u?.avatar_url || "",
        packages: userPackages
      }
    });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.post("/auth/verify-otp", async (c) => {
  try {
    const { email, otp } = await c.req.json();
    if (!email || !otp) {
      return c.json({ error: "email and otp are required" }, 400);
    }
    if (otp.length === 6) {
      const session = await c.env.DB.prepare(
        "SELECT user_id FROM student_sessions WHERE email = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1"
      ).bind(email).first();
      if (session?.user_id) {
        await c.env.DB.prepare(
          "UPDATE users SET email_verified = 1 WHERE id = ?"
        ).bind(session.user_id).run();
        return c.json({ success: true, message: "Email verified successfully" });
      }
    }
    return c.json({ success: false, message: "Invalid OTP" }, 400);
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.post("/auth/forgot-password", async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }
    const user = await c.env.DB.prepare(
      "SELECT id FROM users WHERE email = ? AND is_active = 1"
    ).bind(email).first();
    if (user) {
    }
    return c.json({ success: true, message: "If an account exists with this email, a reset link has been sent." });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.post("/auth/resend-otp", async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }
    return c.json({ success: true, message: "Verification email resent if account exists." });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.post("/institutes/requests", async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const data = await c.req.json();
    const { institute_name, institute_name_bn, division, district } = data;
    if (!institute_name) {
      return c.json({ error: "Institute name required" }, 400);
    }
    const existing = await c.env.DB.prepare(
      "SELECT id FROM institutes WHERE name = ? AND is_active = 1"
    ).bind(institute_name).first();
    if (existing) {
      return c.json({ error: "This institute already exists" }, 400);
    }
    const pending = await c.env.DB.prepare(
      "SELECT id FROM institute_requests WHERE institute_name = ? AND status = 'pending'"
    ).bind(institute_name).first();
    if (pending) {
      return c.json({ error: "A request for this institute is already pending" }, 400);
    }
    await c.env.DB.prepare(`
      INSERT INTO institute_requests (user_id, user_email, user_name, institute_name, institute_name_bn, division, district, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(auth.userId, auth.email, null, institute_name, institute_name_bn || null, division || null, district || null).run();
    return c.json({ success: true, message: "Institute request submitted" });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.get("/institutes/requests/mine", async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const result = await c.env.DB.prepare(
      "SELECT * FROM institute_requests WHERE user_id = ? ORDER BY created_at DESC"
    ).bind(auth.userId).all();
    return c.json({ requests: result.results });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.post("/push/register", async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const { push_token, device_type, device_info } = await c.req.json();
    if (!push_token) {
      return c.json({ error: "push_token required" }, 400);
    }
    await registerPushToken(c.env, auth.userId, push_token, device_type, device_info);
    return c.json({ success: true });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.delete("/push/unregister", async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const { push_token } = await c.req.json();
    if (!push_token) {
      return c.json({ error: "push_token required" }, 400);
    }
    await unregisterPushToken(c.env, push_token);
    return c.json({ success: true });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.post("/payments/submit", async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const { package_id, trx_id, phone, proof_url } = await c.req.json();
    if (!package_id || !trx_id) {
      return c.json({ error: "package_id and trx_id required" }, 400);
    }
    const pkg = await c.env.DB.prepare(
      "SELECT * FROM course_packages WHERE id = ? AND is_active = 1"
    ).bind(package_id).first();
    if (!pkg) {
      return c.json({ error: "Package not found" }, 404);
    }
    const p = pkg;
    await c.env.DB.prepare(`
      INSERT INTO payments (user_id, package_id, course_id, amount, currency, gateway, trx_id_submitted, phone_submitted, proof_url, status)
      VALUES (?, ?, ?, ?, 'BDT', 'manual', ?, ?, ?, 'pending')
    `).bind(auth.userId, package_id, p.course_id, p.price, trx_id, phone || null, proof_url || null).run();
    return c.json({ success: true, message: "Payment submitted for verification" });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.get("/packages/mine", async (c) => {
  try {
    const auth = await getStudentAuth(c);
    if (!auth.authorized) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const result = await c.env.DB.prepare(
      "SELECT up.*, cp.package_type, cp.price, cp.duration_months FROM user_packages up JOIN course_packages cp ON up.package_id = cp.id WHERE up.user_id = ? AND up.status = 'active' ORDER BY up.activated_at DESC"
    ).bind(auth.userId).all();
    return c.json({ packages: result.results });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
var studentAuthenticated = new Hono2();
studentAuthenticated.use("*", studentAuthMiddleware);
studentAuthenticated.get("/notifications", async (c) => {
  try {
    const userId = c.get("studentId");
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = parseInt(c.req.query("offset") || "0");
    const unreadOnly = c.req.query("unread") === "true";
    let where = "WHERE user_id = ?";
    const params = [userId];
    if (unreadOnly) {
      where += " AND is_read = 0";
    }
    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM notifications ${where}`
    ).bind(...params).first();
    const total = countResult?.total || 0;
    const result = await c.env.DB.prepare(
      `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all();
    const notifications = result.results.map((row) => ({
      id: row.id,
      title: row.title || "",
      message: row.message || "",
      type: row.type || "info",
      actionUrl: row.action_url || "",
      read: !!row.is_read,
      createdAt: row.created_at
    }));
    return c.json({ notifications, total });
  } catch (error3) {
    return c.json({ notifications: [], total: 0 });
  }
});
studentAuthenticated.put("/notifications/:id/read", async (c) => {
  try {
    const userId = c.get("studentId");
    const notifId = c.req.param("id");
    const notif = await c.env.DB.prepare(
      "SELECT * FROM notifications WHERE id = ? AND user_id = ?"
    ).bind(notifId, userId).first();
    if (!notif) {
      return c.json({ error: "Notification not found" }, 404);
    }
    await c.env.DB.prepare(
      "UPDATE notifications SET is_read = 1 WHERE id = ?"
    ).bind(notifId).run();
    return c.json({ success: true });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentAuthenticated.put("/notifications/read-all", async (c) => {
  try {
    const userId = c.get("studentId");
    const result = await c.env.DB.prepare(
      "UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0"
    ).bind(userId).run();
    return c.json({ success: true, count: result.meta?.changes || 0 });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentAuthenticated.get("/profile/stats", async (c) => {
  try {
    const userId = c.get("studentId");
    let coursesEnrolled = 0;
    try {
      const enrollResult = await c.env.DB.prepare(
        "SELECT COUNT(*) as total FROM enrollments WHERE user_id = ?"
      ).bind(userId).first();
      coursesEnrolled = enrollResult?.total || 0;
    } catch {
    }
    let certificates = 0;
    try {
      const certResult = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM user_packages WHERE user_id = ? AND status = 'completed'"
      ).bind(userId).first();
      certificates = certResult?.count || 0;
    } catch {
    }
    let currentStreak = 0;
    try {
      const activities = await c.env.DB.prepare(
        "SELECT DISTINCT date(created_at) as day FROM student_activity WHERE user_id = ? ORDER BY day DESC LIMIT 30"
      ).bind(userId).all();
      const days = activities.results.map((r) => r.day);
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 864e5).toISOString().split("T")[0];
      if (days.length > 0 && (days[0] === today || days[0] === yesterday)) {
        currentStreak = 1;
        for (let i = 1; i < days.length; i++) {
          const prev = new Date(days[i - 1]);
          const curr = new Date(days[i]);
          const diff = (prev.getTime() - curr.getTime()) / 864e5;
          if (diff === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    } catch {
    }
    const userDoc = await getStudentUserDoc(c.env, userId);
    const u = userDoc;
    let hoursWatched = 0;
    try {
      const watchResult = await c.env.DB.prepare(
        "SELECT SUM(CASE WHEN metadata LIKE '%watchMinutes%' THEN CAST(json_extract(metadata, '$.watchMinutes') AS REAL) ELSE 0 END) as total_minutes FROM student_activity WHERE user_id = ? AND activity_type = 'video_watch'"
      ).bind(userId).first();
      hoursWatched = Math.round((watchResult?.total_minutes || 0) / 60 * 10) / 10;
    } catch {
    }
    return c.json({
      stats: {
        coursesEnrolled,
        hoursWatched,
        certificates,
        currentStreak
      },
      profile: {
        phone: u?.phone || "",
        bio: u?.bio || "",
        semester: u?.semester || "",
        avatarUrl: u?.avatar_url || ""
      }
    });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentAuthenticated.get("/leaderboard", async (c) => {
  try {
    const technology = c.req.query("technology") || "";
    const period = c.req.query("period") || "week";
    const limit = parseInt(c.req.query("limit") || "20");
    const userId = c.get("studentId");
    const cacheKey = `leaderboard:${technology}:${period}`;
    const cached = await c.env.KV_CONFIG.get(cacheKey, "json");
    if (cached) {
      const result2 = cached;
      const yourEntry = result2.entries.find((e) => e.userId === userId);
      result2.yourRank = yourEntry ? yourEntry.rank : null;
      result2.yourXp = yourEntry ? yourEntry.xp : 0;
      return c.json(result2);
    }
    let dateFilter = "";
    if (period === "day") {
      dateFilter = `AND created_at >= date('now', '-1 day')`;
    } else if (period === "week") {
      dateFilter = `AND created_at >= date('now', '-7 days')`;
    } else if (period === "month") {
      dateFilter = `AND created_at >= date('now', '-30 days')`;
    }
    const d1Query = `
      SELECT
        user_id,
        SUM(CASE WHEN activity_type = 'video_watch' THEN 10 ELSE 0 END) as video_xp,
        SUM(CASE WHEN activity_type = 'quiz_complete' THEN 15 ELSE 0 END) as quiz_xp,
        SUM(CASE WHEN activity_type = 'assignment_submit' THEN 20 ELSE 0 END) as assignment_xp,
        SUM(CASE WHEN activity_type = 'streak_bonus' THEN 5 ELSE 0 END) as streak_xp,
        COUNT(DISTINCT date(created_at)) as active_days,
        COUNT(*) as total_activities
      FROM student_activity
      WHERE 1=1 ${dateFilter}
      GROUP BY user_id
      ORDER BY total_activities DESC
      LIMIT ?
    `;
    const result = await c.env.DB.prepare(d1Query).bind(limit).all();
    const entries = [];
    let rank = 1;
    let yourRank = null;
    let yourXp = 0;
    for (const row of result.results) {
      let userName = "Student";
      let userTechnology = "";
      try {
        const userDoc = await getStudentUserDoc(c.env, row.user_id);
        const u = userDoc;
        userName = u?.full_name || u?.name || "Student";
        userTechnology = u?.technology || "";
      } catch {
      }
      if (technology && userTechnology !== technology) continue;
      const totalXp = (row.video_xp || 0) + (row.quiz_xp || 0) + (row.assignment_xp || 0) + (row.streak_xp || 0);
      if (row.user_id === userId) {
        yourRank = rank;
        yourXp = totalXp;
      }
      entries.push({
        rank,
        userId: row.user_id,
        name: userName,
        technology: userTechnology,
        xp: totalXp,
        breakdown: {
          video: row.video_xp || 0,
          quiz: row.quiz_xp || 0,
          assignment: row.assignment_xp || 0,
          streak: row.streak_xp || 0
        },
        activeDays: row.active_days || 0,
        coursesCompleted: 0
      });
      rank++;
    }
    if (!yourRank) {
      yourXp = 0;
    }
    const response = {
      entries,
      yourRank,
      yourXp,
      period,
      technology: technology || "all"
    };
    await c.env.KV_CONFIG.put(cacheKey, JSON.stringify(response), { expirationTtl: 300 });
    return c.json(response);
  } catch (error3) {
    return c.json({ entries: [], yourRank: null, yourXp: 0, error: getErrorMessage(error3) }, 500);
  }
});
studentAuthenticated.get("/achievements", async (c) => {
  try {
    const userId = c.get("studentId");
    const definitions = await c.env.DB.prepare(
      "SELECT * FROM achievement_definitions WHERE is_active = 1 ORDER BY category, xp ASC"
    ).all();
    const unlocked = await c.env.DB.prepare(
      "SELECT * FROM student_achievements WHERE user_id = ?"
    ).bind(userId).all();
    const unlockedMap = /* @__PURE__ */ new Map();
    for (const row of unlocked.results) {
      unlockedMap.set(row.achievement_id, row.unlocked_at);
    }
    const achievements = definitions.results.map((def) => ({
      id: def.id,
      slug: def.slug,
      name: def.name,
      nameBn: def.name_bn,
      description: def.description,
      descriptionBn: def.description_bn,
      category: def.category,
      icon: def.icon,
      xp: def.xp,
      conditionType: def.condition_type,
      unlocked: unlockedMap.has(def.id),
      unlockedAt: unlockedMap.get(def.id) || null
    }));
    const totalXp = achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.xp, 0);
    const unlockedCount = achievements.filter((a) => a.unlocked).length;
    return c.json({
      achievements,
      totalXp,
      unlockedCount,
      totalCount: achievements.length
    });
  } catch (error3) {
    return c.json({ achievements: [], totalXp: 0, unlockedCount: 0, totalCount: 0 });
  }
});
studentAuthenticated.get("/activity", async (c) => {
  try {
    const userId = c.get("studentId");
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = parseInt(c.req.query("offset") || "0");
    const activityType = c.req.query("type") || "";
    let query = "SELECT * FROM student_activity WHERE user_id = ?";
    const params = [userId];
    if (activityType) {
      query += " AND activity_type = ?";
      params.push(activityType);
    }
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);
    const result = await c.env.DB.prepare(query).bind(...params).all();
    const activities = result.results.map((row) => ({
      id: row.id,
      type: row.activity_type,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      title: row.title,
      description: row.description,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      createdAt: row.created_at
    }));
    return c.json({ activities, total: result.results.length });
  } catch (error3) {
    return c.json({ activities: [], total: 0 });
  }
});
studentAuthenticated.put("/profile", async (c) => {
  try {
    const userId = c.get("studentId");
    const body = await c.req.json();
    const allowedFields = ["full_name", "phone", "bio", "semester", "technology", "institute_id"];
    const setClauses = [];
    const setValues = [];
    for (const field of allowedFields) {
      if (body[field] !== void 0) {
        setClauses.push(`${field} = ?`);
        setValues.push(body[field]);
      }
    }
    if (body.name !== void 0 && !body.full_name) {
      setClauses.push("full_name = ?");
      setValues.push(body.name);
    }
    if (setClauses.length === 0) {
      return c.json({ error: "No valid fields to update" }, 400);
    }
    setClauses.push("updated_at = datetime('now')");
    setValues.push(userId);
    await c.env.DB.prepare(
      `UPDATE users SET ${setClauses.join(", ")} WHERE id = ?`
    ).bind(...setValues).run();
    await c.env.DB.prepare(`
      INSERT INTO student_activity (user_id, activity_type, resource_type, title, description)
      VALUES (?, 'profile_update', 'profile', 'Profile Updated', 'Updated profile information')
    `).bind(userId).run();
    return c.json({ success: true });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentAuthenticated.post("/upload-avatar", async (c) => {
  try {
    const userId = c.get("studentId");
    const formData = await c.req.formData();
    const file = formData.get("avatar");
    if (!file) {
      return c.json({ error: "Avatar file required" }, 400);
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." }, 400);
    }
    if (file.size > 2 * 1024 * 1024) {
      return c.json({ error: "File too large. Maximum 2MB." }, 400);
    }
    const key = `avatars/${userId}/${Date.now()}-${file.name}`;
    await c.env.R2_AVATARS.put(key, file.stream(), {
      httpMetadata: { contentType: file.type }
    });
    const avatarUrl = `https://dakkho-assets.dakkho.workers.dev/avatars/${key}`;
    await c.env.DB.prepare(
      "UPDATE users SET avatar_url = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(avatarUrl, userId).run();
    await c.env.DB.prepare(`
      INSERT INTO student_activity (user_id, activity_type, resource_type, title, description)
      VALUES (?, 'avatar_upload', 'profile', 'Avatar Updated', 'Updated profile picture')
    `).bind(userId).run();
    return c.json({ success: true, avatarUrl });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentAuthenticated.get("/settings", async (c) => {
  try {
    const userId = c.get("studentId");
    const prefs = await c.env.DB.prepare(
      "SELECT * FROM notification_preferences WHERE user_id = ?"
    ).bind(userId).first();
    if (!prefs) {
      return c.json({
        preferences: {
          pushEnabled: true,
          emailEnabled: true,
          smsEnabled: false,
          quietHoursStart: "22:00",
          quietHoursEnd: "08:00",
          courseUpdates: { push: true, email: true },
          grades: { push: true, email: true },
          schedule: { push: true, email: true },
          payment: { push: true, email: true },
          promotions: { push: false, email: false },
          social: { push: true, email: false },
          system: { push: true, email: true }
        }
      });
    }
    const p = prefs;
    return c.json({
      preferences: {
        pushEnabled: !!p.push_enabled,
        emailEnabled: !!p.email_enabled,
        smsEnabled: !!p.sms_enabled,
        quietHoursStart: p.quiet_hours_start,
        quietHoursEnd: p.quiet_hours_end,
        courseUpdates: { push: !!p.course_updates_push, email: !!p.course_updates_email },
        grades: { push: !!p.grades_push, email: !!p.grades_email },
        schedule: { push: !!p.schedule_push, email: !!p.schedule_email },
        payment: { push: !!p.payment_push, email: !!p.payment_email },
        promotions: { push: !!p.promotions_push, email: !!p.promotions_email },
        social: { push: !!p.social_push, email: !!p.social_email },
        system: { push: !!p.system_push, email: !!p.system_email }
      }
    });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentAuthenticated.put("/settings", async (c) => {
  try {
    const userId = c.get("studentId");
    const prefs = await c.req.json();
    await c.env.DB.prepare(`
      INSERT INTO notification_preferences (
        user_id, push_enabled, email_enabled, sms_enabled,
        quiet_hours_start, quiet_hours_end,
        course_updates_push, course_updates_email,
        grades_push, grades_email,
        schedule_push, schedule_email,
        payment_push, payment_email,
        promotions_push, promotions_email,
        social_push, social_email,
        system_push, system_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        push_enabled = excluded.push_enabled,
        email_enabled = excluded.email_enabled,
        sms_enabled = excluded.sms_enabled,
        quiet_hours_start = excluded.quiet_hours_start,
        quiet_hours_end = excluded.quiet_hours_end,
        course_updates_push = excluded.course_updates_push,
        course_updates_email = excluded.course_updates_email,
        grades_push = excluded.grades_push,
        grades_email = excluded.grades_email,
        schedule_push = excluded.schedule_push,
        schedule_email = excluded.schedule_email,
        payment_push = excluded.payment_push,
        payment_email = excluded.payment_email,
        promotions_push = excluded.promotions_push,
        promotions_email = excluded.promotions_email,
        social_push = excluded.social_push,
        social_email = excluded.social_email,
        system_push = excluded.system_push,
        system_email = excluded.system_email,
        updated_at = datetime('now')
    `).bind(
      userId,
      prefs.pushEnabled ? 1 : 0,
      prefs.emailEnabled ? 1 : 0,
      prefs.smsEnabled ? 1 : 0,
      prefs.quietHoursStart || "22:00",
      prefs.quietHoursEnd || "08:00",
      prefs.courseUpdates?.push ? 1 : 0,
      prefs.courseUpdates?.email ? 1 : 0,
      prefs.grades?.push ? 1 : 0,
      prefs.grades?.email ? 1 : 0,
      prefs.schedule?.push ? 1 : 0,
      prefs.schedule?.email ? 1 : 0,
      prefs.payment?.push ? 1 : 0,
      prefs.payment?.email ? 1 : 0,
      prefs.promotions?.push ? 1 : 0,
      prefs.promotions?.email ? 1 : 0,
      prefs.social?.push ? 1 : 0,
      prefs.social?.email ? 1 : 0,
      prefs.system?.push ? 1 : 0,
      prefs.system?.email ? 1 : 0
    ).run();
    return c.json({ success: true });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
studentApiRoutes.route("/student", studentAuthenticated);
var student_api_default = studentApiRoutes;

// src/routes/push.ts
var pushRoutes = new Hono2();
pushRoutes.use("*", adminAuthMiddleware);
pushRoutes.post("/broadcast", async (c) => {
  try {
    const { title: title2, titleBn, message, messageBn, url, data } = await c.req.json();
    if (!title2 || !message) {
      return c.json({ error: "title and message required" }, 400);
    }
    const result = await sendPushNotification(c.env, {
      title: title2,
      titleBn,
      message,
      messageBn,
      url,
      data,
      targetSegment: "All"
    });
    await c.env.DB.prepare(`
      INSERT INTO notification_logs (type, category, title, message, target_type, sent_count, failed_count, metadata, created_by)
      VALUES ('push', 'broadcast', ?, ?, 'all', ?, ?, ?, ?)
    `).bind(title2, message, result.recipients, result.errors.length, JSON.stringify(data || {}), c.get("user").id).run();
    const user = c.get("user");
    await logAudit(c.env, user.id, "BROADCAST_PUSH", "notifications", void 0, { title: title2, recipients: result.recipients });
    return c.json({ success: result.success, recipients: result.recipients, errors: result.errors });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
pushRoutes.post("/send", async (c) => {
  try {
    const { userIds, title: title2, titleBn, message, messageBn, url, data } = await c.req.json();
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return c.json({ error: "userIds array required" }, 400);
    }
    if (!title2 || !message) {
      return c.json({ error: "title and message required" }, 400);
    }
    const tokens = await getBatchUserPushTokens(c.env, userIds);
    if (tokens.length === 0) {
      return c.json({ success: false, message: "No push tokens found for specified users" });
    }
    const result = await sendPushNotification(c.env, {
      title: title2,
      titleBn,
      message,
      messageBn,
      url,
      data,
      targetPlayerIds: tokens
    });
    await c.env.DB.prepare(`
      INSERT INTO notification_logs (type, category, title, message, target_type, target_id, sent_count, failed_count, metadata, created_by)
      VALUES ('push', 'targeted', ?, ?, 'users', ?, ?, ?, ?, ?)
    `).bind(title2, message, userIds.join(","), result.recipients, result.errors.length, JSON.stringify(data || {}), c.get("user").id).run();
    return c.json({ success: result.success, recipients: result.recipients, errors: result.errors });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
pushRoutes.get("/stats", async (c) => {
  try {
    const totalTokens = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM user_push_tokens WHERE is_active = 1"
    ).first();
    const recentLogs = await c.env.DB.prepare(
      "SELECT * FROM notification_logs WHERE type = 'push' ORDER BY created_at DESC LIMIT 10"
    ).all();
    return c.json({
      totalSubscribers: totalTokens?.count || 0,
      recentNotifications: recentLogs.results
    });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
pushRoutes.get("/logs", async (c) => {
  try {
    const type = c.req.query("type") || "all";
    const category = c.req.query("category") || "all";
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = (page - 1) * limit;
    let query = "SELECT * FROM notification_logs";
    let countQuery = "SELECT COUNT(*) as total FROM notification_logs";
    const params = [];
    const conditions = [];
    if (type !== "all") {
      conditions.push("type = ?");
      params.push(type);
    }
    if (category !== "all") {
      conditions.push("category = ?");
      params.push(category);
    }
    if (conditions.length > 0) {
      const whereClause = " WHERE " + conditions.join(" AND ");
      query += whereClause;
      countQuery += whereClause;
    }
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;
    const result = await c.env.DB.prepare(query).bind(...params, limit, offset).all();
    return c.json({ logs: result.results, total });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
var push_default = pushRoutes;

// src/routes/technologies.ts
var techRoutes = new Hono2();
techRoutes.use("*", adminAuthMiddleware);
techRoutes.get("/", async (c) => {
  try {
    const result = await c.env.DB.prepare(
      "SELECT * FROM technologies ORDER BY name ASC"
    ).all();
    return c.json({ technologies: result.results });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
techRoutes.post("/", async (c) => {
  try {
    const data = await c.req.json();
    const { name, name_bn, short_code, description } = data;
    if (!name) {
      return c.json({ error: "Name is required" }, 400);
    }
    if (short_code) {
      const existing = await c.env.DB.prepare(
        "SELECT id FROM technologies WHERE short_code = ?"
      ).bind(short_code).first();
      if (existing) {
        return c.json({ error: "Short code already exists" }, 400);
      }
    }
    await c.env.DB.prepare(`
      INSERT INTO technologies (name, name_bn, short_code, description)
      VALUES (?, ?, ?, ?)
    `).bind(name, name_bn || null, short_code || null, description || null).run();
    const user = c.get("user");
    await logAudit(c.env, user.id, "CREATE_TECHNOLOGY", "technologies", null, data);
    return c.json({ success: true, message: "Technology created" });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
techRoutes.put("/", async (c) => {
  try {
    const data = await c.req.json();
    const { technologyId, ...updates } = data;
    if (!technologyId) {
      return c.json({ error: "technologyId is required" }, 400);
    }
    const existing = await c.env.DB.prepare(
      "SELECT id FROM technologies WHERE id = ?"
    ).bind(technologyId).first();
    if (!existing) {
      return c.json({ error: "Technology not found" }, 404);
    }
    const fields = [];
    const values = [];
    if (updates.name !== void 0) {
      fields.push("name = ?");
      values.push(updates.name);
    }
    if (updates.name_bn !== void 0) {
      fields.push("name_bn = ?");
      values.push(updates.name_bn);
    }
    if (updates.short_code !== void 0) {
      fields.push("short_code = ?");
      values.push(updates.short_code);
    }
    if (updates.description !== void 0) {
      fields.push("description = ?");
      values.push(updates.description);
    }
    if (updates.is_active !== void 0) {
      fields.push("is_active = ?");
      values.push(updates.is_active);
    }
    if (fields.length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }
    fields.push("updated_at = datetime('now')");
    values.push(technologyId);
    await c.env.DB.prepare(
      `UPDATE technologies SET ${fields.join(", ")} WHERE id = ?`
    ).bind(...values).run();
    const user = c.get("user");
    await logAudit(c.env, user.id, "UPDATE_TECHNOLOGY", "technologies", String(technologyId), updates);
    return c.json({ success: true, message: "Technology updated" });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
techRoutes.delete("/", async (c) => {
  try {
    const technologyId = c.req.query("id");
    if (!technologyId) {
      return c.json({ error: "Technology ID required" }, 400);
    }
    await c.env.DB.prepare("DELETE FROM technologies WHERE id = ?").bind(technologyId).run();
    const user = c.get("user");
    await logAudit(c.env, user.id, "DELETE_TECHNOLOGY", "technologies", technologyId);
    return c.json({ success: true });
  } catch (error3) {
    return c.json({ error: getErrorMessage(error3) }, 500);
  }
});
var technologies_default = techRoutes;

// src/routes/packages.ts
var packageRoutes = new Hono2();
packageRoutes.use("*", adminAuthMiddleware);
packageRoutes.get("/", async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const courseId = c.req.query("courseId") || "";
    const offset = (page - 1) * limit;
    let where = "WHERE 1=1";
    const params = [];
    if (courseId) {
      where += " AND course_id = ?";
      params.push(courseId);
    }
    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM course_packages ${where}`
    ).bind(...params).first();
    const total = countResult?.total || 0;
    const result = await c.env.DB.prepare(
      `SELECT * FROM course_packages ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all();
    return c.json({ documents: result.results, total });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
packageRoutes.post("/", async (c) => {
  try {
    const data = await c.req.json();
    await c.env.DB.prepare(`
      INSERT INTO course_packages (course_id, package_type, price, duration_months, max_users, is_auto_assign, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.course_id || "",
      data.package_type || "individual",
      data.price || 0,
      data.duration_months || 6,
      data.max_users || 1,
      data.is_auto_assign !== void 0 ? data.is_auto_assign ? 1 : 0 : 1,
      data.is_active !== void 0 ? data.is_active ? 1 : 0 : 1,
      data.created_by || null
    ).run();
    const created = await c.env.DB.prepare(
      "SELECT * FROM course_packages WHERE rowid = last_insert_rowid()"
    ).first();
    const user = c.get("user");
    await logAudit(c.env, user.id, "CREATE_PACKAGE", "packages", String(created?.id), data);
    return c.json({ document: created });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
packageRoutes.put("/", async (c) => {
  try {
    const data = await c.req.json();
    const { packageId, ...updates } = data;
    if (!packageId) {
      return c.json({ error: "Package ID required" }, 400);
    }
    const allowedFields = ["course_id", "package_type", "price", "duration_months", "max_users", "is_auto_assign", "is_active"];
    const setClauses = [];
    const setValues = [];
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === "is_auto_assign" || key === "is_active") {
          setClauses.push(`${key} = ?`);
          setValues.push(value ? 1 : 0);
        } else {
          setClauses.push(`${key} = ?`);
          setValues.push(value);
        }
      }
    }
    if (setClauses.length === 0) {
      return c.json({ error: "No valid fields to update" }, 400);
    }
    setClauses.push("updated_at = datetime('now')");
    setValues.push(String(packageId));
    await c.env.DB.prepare(
      `UPDATE course_packages SET ${setClauses.join(", ")} WHERE id = ?`
    ).bind(...setValues).run();
    const updated = await c.env.DB.prepare("SELECT * FROM course_packages WHERE id = ?").bind(String(packageId)).first();
    const user = c.get("user");
    await logAudit(c.env, user.id, "UPDATE_PACKAGE", "packages", String(packageId), updates);
    return c.json({ document: updated });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
packageRoutes.delete("/", async (c) => {
  try {
    const packageId = c.req.query("id");
    if (!packageId) {
      return c.json({ error: "Package ID required" }, 400);
    }
    await c.env.DB.prepare("DELETE FROM course_packages WHERE id = ?").bind(packageId).run();
    const user = c.get("user");
    await logAudit(c.env, user.id, "DELETE_PACKAGE", "packages", packageId);
    return c.json({ success: true });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
var packages_default = packageRoutes;

// src/routes/enrollments.ts
var enrollmentRoutes = new Hono2();
enrollmentRoutes.use("*", adminAuthMiddleware);
enrollmentRoutes.get("/", async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const userId = c.req.query("userId") || "";
    const courseId = c.req.query("courseId") || "";
    const offset = (page - 1) * limit;
    let where = "WHERE 1=1";
    const params = [];
    if (userId) {
      where += " AND e.user_id = ?";
      params.push(userId);
    }
    if (courseId) {
      where += " AND e.course_id = ?";
      params.push(courseId);
    }
    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM enrollments e ${where}`
    ).bind(...params).first();
    const total = countResult?.total || 0;
    const result = await c.env.DB.prepare(
      `SELECT e.*, u.full_name as user_name, u.email as user_email, c.title as course_title
       FROM enrollments e
       LEFT JOIN users u ON e.user_id = u.id
       LEFT JOIN courses c ON e.course_id = c.id
       ${where}
       ORDER BY e.created_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all();
    return c.json({ documents: result.results, total });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
enrollmentRoutes.delete("/", async (c) => {
  try {
    const enrollmentId = c.req.query("id");
    if (!enrollmentId) {
      return c.json({ error: "Enrollment ID required" }, 400);
    }
    await c.env.DB.prepare("DELETE FROM enrollments WHERE id = ?").bind(enrollmentId).run();
    const user = c.get("user");
    await logAudit(c.env, user.id, "DELETE_ENROLLMENT", "enrollments", enrollmentId);
    return c.json({ success: true });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
var enrollments_default = enrollmentRoutes;

// src/routes/achievements.ts
var achievementRoutes = new Hono2();
achievementRoutes.use("*", adminAuthMiddleware);
achievementRoutes.get("/", async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const category = c.req.query("category") || "";
    const offset = (page - 1) * limit;
    let where = "WHERE 1=1";
    const params = [];
    if (category) {
      where += " AND ad.category = ?";
      params.push(category);
    }
    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM achievement_definitions ad ${where}`
    ).bind(...params).first();
    const total = countResult?.total || 0;
    const result = await c.env.DB.prepare(
      `SELECT ad.*, 
        (SELECT COUNT(*) FROM student_achievements sa WHERE sa.achievement_id = ad.id) as unlock_count
       FROM achievement_definitions ad
       ${where}
       ORDER BY ad.category, ad.xp ASC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all();
    return c.json({ documents: result.results, total });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
achievementRoutes.post("/", async (c) => {
  try {
    const data = await c.req.json();
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await c.env.DB.prepare(`
      INSERT INTO achievement_definitions (slug, name, name_bn, description, description_bn, category, icon, xp, condition_type, condition_value, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      slug,
      data.name || "",
      data.name_bn || null,
      data.description || "",
      data.description_bn || null,
      data.category || "learning",
      data.icon || "trophy",
      data.xp || 0,
      data.condition_type || "",
      data.condition_value || "",
      data.is_active !== void 0 ? data.is_active ? 1 : 0 : 1
    ).run();
    const created = await c.env.DB.prepare(
      "SELECT * FROM achievement_definitions WHERE rowid = last_insert_rowid()"
    ).first();
    const user = c.get("user");
    await logAudit(c.env, user.id, "CREATE_ACHIEVEMENT", "achievements", String(created?.id), data);
    return c.json({ document: created });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
achievementRoutes.put("/", async (c) => {
  try {
    const data = await c.req.json();
    const { achievementId, ...updates } = data;
    if (!achievementId) {
      return c.json({ error: "Achievement ID required" }, 400);
    }
    const allowedFields = ["slug", "name", "name_bn", "description", "description_bn", "category", "icon", "xp", "condition_type", "condition_value", "is_active"];
    const setClauses = [];
    const setValues = [];
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === "is_active") {
          setClauses.push(`${key} = ?`);
          setValues.push(value ? 1 : 0);
        } else {
          setClauses.push(`${key} = ?`);
          setValues.push(value);
        }
      }
    }
    if (setClauses.length === 0) {
      return c.json({ error: "No valid fields to update" }, 400);
    }
    setValues.push(String(achievementId));
    await c.env.DB.prepare(
      `UPDATE achievement_definitions SET ${setClauses.join(", ")} WHERE id = ?`
    ).bind(...setValues).run();
    const updated = await c.env.DB.prepare("SELECT * FROM achievement_definitions WHERE id = ?").bind(String(achievementId)).first();
    const user = c.get("user");
    await logAudit(c.env, user.id, "UPDATE_ACHIEVEMENT", "achievements", String(achievementId), updates);
    return c.json({ document: updated });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
achievementRoutes.delete("/", async (c) => {
  try {
    const achievementId = c.req.query("id");
    if (!achievementId) {
      return c.json({ error: "Achievement ID required" }, 400);
    }
    await c.env.DB.prepare("DELETE FROM student_achievements WHERE achievement_id = ?").bind(achievementId).run();
    await c.env.DB.prepare("DELETE FROM achievement_definitions WHERE id = ?").bind(achievementId).run();
    const user = c.get("user");
    await logAudit(c.env, user.id, "DELETE_ACHIEVEMENT", "achievements", achievementId);
    return c.json({ success: true });
  } catch (error3) {
    const message = getErrorMessage(error3);
    return c.json({ error: message }, 500);
  }
});
var achievements_default = achievementRoutes;

// src/index.ts
var app = new Hono2();
app.use("*", cors({
  origin: [
    "https://grayrat2026.github.io",
    "https://dakkho.pro.bd",
    "http://localhost:3000",
    // Cloudflare Pages domains
    "https://dakkho-admin.pages.dev",
    // Student app domains
    "https://dakkhostudent.pages.dev",
    "https://dakkho-student.pages.dev"
  ],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "apikey"],
  exposeHeaders: ["Content-Length"],
  maxAge: 86400,
  credentials: true
}));
app.use("*", logger());
app.get("/", (c) => c.json({
  service: "DAKKHO Admin API",
  version: "2.0.0",
  status: "healthy",
  timestamp: (/* @__PURE__ */ new Date()).toISOString(),
  runtime: "Cloudflare Workers",
  framework: "Hono",
  backend: "D1"
}));
app.route("/admin/auth", auth_default);
app.route("/admin/system", system_default);
app.route("/admin/users", users_default);
app.route("/admin/categories", categories_default);
app.route("/admin/instructors", instructors_default);
app.route("/admin/courses", courses_default);
app.route("/admin/videos", videos_default);
app.route("/admin/institutes", institutes_default);
app.route("/admin/config", config_default);
app.route("/admin/notifications", notifications_default);
app.route("/admin/analytics", analytics_default);
app.route("/admin/upload", upload_default);
app.route("/admin/email", email_default);
app.route("/admin/admin", admin_default);
app.route("/admin/coupons", coupons_default);
app.route("/admin/discounts", discounts_default);
app.route("/admin/events", events_default);
app.route("/admin/live-classes", live_classes_default);
app.route("/admin/payments", payments_default);
app.route("/admin/institute-requests", institute_requests_default);
app.route("/admin/push", push_default);
app.route("/admin/technologies", technologies_default);
app.route("/admin/packages", packages_default);
app.route("/admin/enrollments", enrollments_default);
app.route("/admin/achievements", achievements_default);
app.route("/api", student_api_default);
app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: err.message || "Internal server error" }, 500);
});
var index_default = app;
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
