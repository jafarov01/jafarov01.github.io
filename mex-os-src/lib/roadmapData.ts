export interface RoadmapTask {
day: number | string;
id: string;
title: string;
priority: string;
storyPoints: number | string;
description: string;
requirements: string[];
acceptanceCriteria: string[];
technicalHints: string[];
estimatedTime: string;
domainConnection: string;
}

export interface RoadmapPhase {
phase: number;
title: string;
description: string;
tasks: RoadmapTask[];
}

export const ROADMAP_DATA: RoadmapPhase[] = [
  {
    "phase": 1,
    "title": "FUNDAMENTALS WARMUP",
    "description": "Get your hands dirty again with manageable tasks",
    "tasks": [
      {
        "day": 1,
        "id": "SYS",
        "title": "RAII File Descriptor Wrapper",
        "priority": "Medium",
        "storyPoints": 3,
        "description": "Create a simple RAII wrapper around file descriptors that automatically  closes files when going out of scope. This is the most basic resource  management pattern in C++.",
        "requirements": [
          "Wrap open/close for file descriptors",
          "Automatic cleanup in destructor",
          "Non-copyable (deleted copy constructor/assignment)",
          "Movable (implement move semantics)",
          "Provide read() and write() methods"
        ],
        "acceptanceCriteria": [
          "Opens file in constructor or via open() method",
          "Automatically closes in destructor",
          "Cannot be copied (compile error if attempted)",
          "Can be moved (transferred ownership works)",
          "No file descriptor leaks (verify with lsof or similar)",
          "Simple test program that reads/writes files"
        ],
        "technicalHints": [
          "Use fd = -1 as invalid sentinel",
          "open() returns file descriptor: int fd = ::open(path, flags)",
          "close() in destructor: if (fd >= 0) ::close(fd)",
          "Move constructor: steal fd, set source to -1",
          "Deleted copy: ClassName(const ClassName&) = delete;"
        ],
        "estimatedTime": "3-4 hours",
        "domainConnection": "General C++ - Foundation for all resource management in embedded/automotive systems"
      },
      {
        "day": 2,
        "id": "SYS",
        "title": "Circular Buffer for Embedded Systems",
        "priority": "Medium",
        "storyPoints": 3,
        "description": "Implement a fixed-size circular buffer (ring buffer) that's commonly used  in embedded systems for buffering sensor data, CAN messages, or serial data.",
        "requirements": [
          "Template class RingBuffer<T, SIZE>",
          "Fixed capacity known at compile time",
          "push() adds element (overwrites oldest if full)",
          "pop() removes oldest element",
          "Full/empty detection",
          "No dynamic memory allocation"
        ],
        "acceptanceCriteria": [
          "Template works with different types (int, struct, etc.)",
          "Handles wrapping around correctly",
          "size(), capacity(), empty(), full() methods work",
          "Can push SIZE elements before overwriting",
          "Iterator support (begin/end) for range-based for loop",
          "No heap allocation (verify with custom operator new)"
        ],
        "technicalHints": [
          "Use std::array<T, SIZE> for storage",
          "Two indices: head (write position), tail (read position)",
          "Full when: (head + 1) % SIZE == tail",
          "Empty when: head == tail",
          "Consider keeping count separately for easier full/empty detection"
        ],
        "estimatedTime": "3-4 hours",
        "domainConnection": "RTOS/Embedded - Used in every real-time system for buffering between ISRs and tasks"
      },
      {
        "day": 3,
        "id": "SYS",
        "title": "Finite State Machine Template",
        "priority": "Medium",
        "storyPoints": 4,
        "description": "Create a generic state machine implementation that can be used for  embedded control systems (like AUTOSAR mode management or vehicle states).",
        "requirements": [
          "Define states as enum class",
          "Register state transition handlers",
          "process_event() triggers transitions",
          "Track current state",
          "Entry/exit actions for states",
          "Compile-time type safety"
        ],
        "acceptanceCriteria": [
          "Define states and events as enums",
          "Register transitions: on(State::A, Event::X) -> State::B",
          "Handles invalid transitions gracefully",
          "Entry/exit callbacks work correctly",
          "Example implementation: traffic light or door lock system",
          "No dynamic dispatch overhead (template-based)"
        ],
        "technicalHints": [
          "Use std::map or std::unordered_map for transition table",
          "Key: pair<State, Event>, Value: State",
          "std::function for callbacks or template function objects",
          "Consider std::variant for type-safe event data",
          "Look at AUTOSAR Mode Management for real-world patterns"
        ],
        "estimatedTime": "4-5 hours",
        "domainConnection": "AUTOSAR - Mode management and state machines are fundamental in AUTOSAR architecture"
      }
    ]
  },
  {
    "phase": 2,
    "title": "MEMORY MANAGEMENT",
    "description": "Build deterministic allocators for real-time systems",
    "tasks": [
      {
        "day": 4,
        "id": "SYS",
        "title": "Fixed-Block Memory Pool Allocator",
        "priority": "High",
        "storyPoints": 5,
        "description": "Implement a memory pool that pre-allocates fixed-size blocks for  deterministic O(1) allocation/deallocation. This is required for  ASIL-rated AUTOSAR components where malloc() is prohibited.",
        "requirements": [
          "Pre-allocate N blocks of fixed size",
          "allocate() returns block from free list",
          "deallocate() returns block to free list",
          "O(1) allocation/deallocation guaranteed",
          "Track free/used blocks",
          "Thread-unsafe (single-threaded for now)"
        ],
        "acceptanceCriteria": [
          "PoolAllocator(blockSize, blockCount) constructor",
          "void* allocate() returns nullptr when exhausted",
          "void deallocate(void* ptr) returns block to pool",
          "No memory leaks (valgrind clean)",
          "Benchmark: 5x+ faster than malloc for 10k allocations",
          "Timing measurements show constant-time behavior"
        ],
        "technicalHints": [
          "Allocate one big chunk: new char[blockSize * numBlocks]",
          "Free list: each free block contains pointer to next free block",
          "Use union or reinterpret_cast for pointer storage",
          "Initialize free list in constructor (link all blocks)",
          "allocate(): pop from free list head",
          "deallocate(): push to free list head"
        ],
        "estimatedTime": "4-6 hours",
        "domainConnection": "AUTOSAR/ISO 26262 - Deterministic memory allocation for safety-critical real-time systems"
      },
      {
        "day": 5,
        "id": "SYS",
        "title": "Generic Object Pool for Message Buffers",
        "priority": "High",
        "storyPoints": 5,
        "description": "Create a reusable object pool for constructed objects (not just raw memory). In AUTOSAR, this is used for COM message buffers, RTE data elements, and  signal objects that are reused rather than repeatedly constructed/destructed.",
        "requirements": [
          "Template class ObjectPool<T, N>",
          "Pre-constructs objects at initialization",
          "acquire() returns constructed object reference",
          "release(obj) returns object to pool",
          "Proper constructor/destructor calls",
          "Works with non-trivial types"
        ],
        "acceptanceCriteria": [
          "Template works with custom classes (not just POD)",
          "Handles constructor arguments via perfect forwarding",
          "Destructor called only at pool destruction, not on release",
          "reset() method to reinitialize objects",
          "Example with CAN message struct or similar",
          "Benchmark shows 10x+ speedup vs new/delete"
        ],
        "technicalHints": [
          "Use std::aligned_storage for raw memory",
          "placement new for construction: new (ptr) T(args...)",
          "Don't call destructor on release (just reset state)",
          "Free list of indices or pointers",
          "Consider std::vector<std::optional<T>> as storage"
        ],
        "estimatedTime": "5-6 hours",
        "domainConnection": "AUTOSAR COM - Message object pooling in communication middleware"
      },
      {
        "day": 6,
        "id": "SYS",
        "title": "Intrusive Reference Counted Pointer",
        "priority": "Medium",
        "storyPoints": 5,
        "description": "Implement an intrusive reference-counted smart pointer similar to  boost::intrusive_ptr. This is used in real-time systems where you need  reference counting but can't afford shared_ptr's atomic overhead on every copy.",
        "requirements": [
          "IntrusivePtr<T> where T has ref_count member",
          "Increment ref count on copy",
          "Decrement on destruction, delete when reaches zero",
          "Move semantics (no ref count change)",
          "Thread-unsafe version (atomic version as bonus)",
          "Dereference operators (*, ->)"
        ],
        "acceptanceCriteria": [
          "Works with classes that have add_ref()/release() methods",
          "Object deleted when last pointer destroyed",
          "Move operations don't change ref count",
          "Copy operations correctly increment count",
          "No memory leaks with circular references test",
          "Comparison with std::shared_ptr overhead"
        ],
        "technicalHints": [
          "Require base class with: void add_ref(), void release()",
          "Constructor: if (ptr) ptr->add_ref()",
          "Destructor: if (ptr) ptr->release()",
          "release() implementation: if (--count == 0) delete this",
          "Move: steal pointer, set source to nullptr (no ref change)",
          "Look at COM IUnknown pattern for reference"
        ],
        "estimatedTime": "5-6 hours",
        "domainConnection": "General/Automotive - Custom memory management avoiding STL overhead in resource-constrained ECUs"
      },
      {
        "day": 7,
        "id": "SYS",
        "title": "Linear Stack-Based Allocator",
        "priority": "High",
        "storyPoints": 5,
        "description": "Build a stack allocator that allocates from a pre-allocated buffer in  stack order (LIFO). Used in game engines and real-time systems for  per-frame allocations or scope-based memory.",
        "requirements": [
          "Allocate from fixed buffer in linear fashion",
          "Deallocate must happen in reverse order (stack discipline)",
          "Support alignment requirements",
          "Marker/rewind functionality (free all since marker)",
          "Fast allocation (just bump pointer)"
        ],
        "acceptanceCriteria": [
          "StackAllocator(bufferSize) pre-allocates buffer",
          "void* allocate(size, alignment) returns aligned memory",
          "deallocate() works only in reverse order (assert/throw otherwise)",
          "Marker get_marker() and rewind(marker) work correctly",
          "Handles alignment padding correctly",
          "Benchmark shows <10ns allocation time"
        ],
        "technicalHints": [
          "Single pointer tracks current position",
          "Alignment: ptr = (ptr + alignment - 1) & ~(alignment - 1)",
          "Store allocation size before each block for validation",
          "Marker is just current pointer position",
          "Rewind: just set pointer back to marker",
          "Can use in combination with RAII marker class"
        ],
        "estimatedTime": "5-6 hours",
        "domainConnection": "RTOS - Per-task stack allocations, scope-based memory for interrupt handlers"
      }
    ]
  },
  {
    "phase": 3,
    "title": "CONCURRENCY & RTOS CONCEPTS",
    "description": "Build the primitives that RTOS kernels provide",
    "tasks": [
      {
        "day": 8,
        "id": "SYS",
        "title": "Build Spinlock with std::atomic",
        "priority": "High",
        "storyPoints": 5,
        "description": "Implement your own spinlock (busy-wait mutex) using atomic operations. In RTOS kernels, spinlocks protect critical sections shorter than  context switch overhead (~1-10 microseconds).",
        "requirements": [
          "lock() and unlock() using std::atomic<bool>",
          "try_lock() variant",
          "Proper memory ordering (acquire/release)",
          "Optional: exponential backoff version",
          "Optional: adaptive spin (try spinning, then yield)"
        ],
        "acceptanceCriteria": [
          "Protects shared data correctly (multi-threaded test)",
          "Uses std::memory_order_acquire/release correctly",
          "try_lock() returns immediately without blocking",
          "Benchmark vs std::mutex for short critical sections (<100ns)",
          "No data races (run with ThreadSanitizer)",
          "Documentation explaining memory ordering choices"
        ],
        "technicalHints": [
          "lock(): while(flag.exchange(true, std::memory_order_acquire)) {}",
          "unlock(): flag.store(false, std::memory_order_release)",
          "try_lock(): return !flag.exchange(true, std::memory_order_acquire)",
          "Backoff: std::this_thread::sleep_for with exponential increase",
          "Compare with std::atomic_flag for potentially better performance"
        ],
        "estimatedTime": "5-6 hours",
        "domainConnection": "RTOS - Kernel-level synchronization primitive for short critical sections"
      },
      {
        "day": 9,
        "id": "SYS",
        "title": "Single-Producer Single-Consumer Lock-Free Queue",
        "priority": "High",
        "storyPoints": 6,
        "description": "Implement a lock-free bounded queue for exactly one producer and one  consumer thread. This is used for inter-task communication in RTOS  where one task produces data and another consumes it.",
        "requirements": [
          "Fixed-size circular buffer",
          "push() for producer (returns false if full)",
          "pop() for consumer (returns false if empty)",
          "Uses std::atomic for synchronization (no mutexes)",
          "Lock-free (wait-free is bonus)",
          "Single producer + single consumer only"
        ],
        "acceptanceCriteria": [
          "Thread-safe for 1 producer + 1 consumer simultaneously",
          "Uses memory_order_acquire/release (not seq_cst everywhere)",
          "Handles full/empty conditions correctly",
          "No data corruption after 1M items passed between threads",
          "Benchmark vs std::queue with mutex",
          "Stress test with varying push/pop rates"
        ],
        "technicalHints": [
          "Two atomic indices: head (consumer), tail (producer)",
          "Producer only modifies tail, consumer only modifies head",
          "Full: (tail + 1) % capacity == head (producer checks this)",
          "Empty: tail == head (consumer checks this)",
          "Producer: load head (acquire), check full, store tail (release)",
          "Consumer: load tail (acquire), check empty, store head (release)"
        ],
        "estimatedTime": "6-8 hours",
        "domainConnection": "RTOS - Zero-overhead inter-task communication without kernel locks"
      },
      {
        "day": 10,
        "id": "SYS",
        "title": "Counting Semaphore from Scratch",
        "priority": "High",
        "storyPoints": 5,
        "description": "Build a counting semaphore using mutex and condition variable. Semaphores are fundamental RTOS primitives for resource management  and producer-consumer patterns.",
        "requirements": [
          "Initialize with count",
          "wait()/P() operation (decrement, block if zero)",
          "signal()/V() operation (increment, wake waiter)",
          "try_wait() variant (non-blocking)",
          "Optional: timed_wait() variant",
          "Correct FIFO wakeup ordering"
        ],
        "acceptanceCriteria": [
          "Semaphore(initial_count) constructor",
          "wait() blocks when count is zero",
          "signal() increments and wakes one waiter",
          "Multiple threads can wait simultaneously",
          "try_wait() returns immediately",
          "Example: producer-consumer with semaphores"
        ],
        "technicalHints": [
          "Use std::mutex + std::condition_variable + int count",
          "wait(): lock mutex, while (count == 0) cv.wait(), --count, unlock",
          "signal(): lock mutex, ++count, cv.notify_one(), unlock",
          "try_wait(): lock, if (count > 0) { --count; return true; } else return false",
          "For FIFO: std::condition_variable already provides FIFO semantics"
        ],
        "estimatedTime": "4-5 hours",
        "domainConnection": "RTOS - Core synchronization primitive in FreeRTOS, VxWorks, QNX"
      },
      {
        "day": 11,
        "id": "SYS",
        "title": "Fixed-Priority Task Scheduler Simulator",
        "priority": "High",
        "storyPoints": 6,
        "description": "Simulate a fixed-priority preemptive scheduler like those in AUTOSAR OS  or FreeRTOS. Tasks have priorities and deadlines, and higher priority  always preempts lower priority.",
        "requirements": [
          "Tasks with: ID, priority, execution time, period/deadline",
          "Ready queue sorted by priority",
          "Scheduler picks highest priority ready task",
          "Simulate preemption",
          "Track: CPU utilization, deadline misses",
          "Simple round-robin for same priority"
        ],
        "acceptanceCriteria": [
          "Add tasks with different priorities",
          "Simulation loop: pick highest priority ready task, run quantum",
          "Preemption works (high priority interrupts low priority)",
          "Periodic tasks re-added to ready queue after period",
          "Report deadline misses",
          "Example: 3 tasks (high/med/low priority)"
        ],
        "technicalHints": [
          "Use std::priority_queue or std::multimap for ready queue",
          "Task struct: id, priority, exec_time_remaining, period, next_release",
          "Simulation: discrete event simulation with time steps",
          "Check at each time unit: release tasks, pick highest priority, execute",
          "Priority inversion scenario as test case",
          "Compare with Rate Monotonic Scheduling analysis"
        ],
        "estimatedTime": "6-7 hours",
        "domainConnection": "RTOS/AUTOSAR OS - Simulates real-time task scheduling in embedded operating systems"
      }
    ]
  },
  {
    "phase": 4,
    "title": "AUTOMOTIVE NETWORKING",
    "description": "CAN, Ethernet, and protocol handling",
    "tasks": [
      {
        "day": 12,
        "id": "SYS",
        "title": "CAN 2.0 Frame Parser and Encoder",
        "priority": "High",
        "storyPoints": 6,
        "description": "Parse and encode CAN frames according to CAN 2.0 specification. Every automotive engineer needs to work with CAN at the byte level  for debugging communication issues.",
        "requirements": [
          "Parse CAN frame: ID (11-bit/29-bit), DLC, data bytes",
          "Encode signals into CAN frames (bit manipulation)",
          "Decode signals from CAN frames",
          "Handle little/big endian, signed/unsigned",
          "Support for multiplexed signals (basic)"
        ],
        "acceptanceCriteria": [
          "Struct for CAN frame (id, dlc, data[8])",
          "Parse from raw bytes",
          "Extract signals: getSignal(start_bit, length, byte_order, signed)",
          "Set signals: setSignal(value, start_bit, length, ...)",
          "Handle bit fields spanning multiple bytes",
          "Unit tests with known CAN frames"
        ],
        "technicalHints": [
          "CAN frame: ID (11 or 29 bits), DLC (4 bits), data (0-8 bytes)",
          "Signal extraction: bit masking and shifting",
          "Little endian (Intel): LSB first, Big endian (Motorola): MSB first",
          "Start bit: position in 64-bit data field",
          "Use bit manipulation: (data >> start) & ((1 << length) - 1)"
        ],
        "estimatedTime": "6-7 hours",
        "domainConnection": "AUTOSAR COM - Foundation for CAN communication in vehicle networks"
      },
      {
        "day": 13,
        "id": "SYS",
        "title": "Parse CAN Database (DBC) Format",
        "priority": "Medium",
        "storyPoints": 7,
        "description": "Parse DBC files that define CAN message and signal mappings. This is the industry standard format for defining vehicle network protocols.",
        "requirements": [
          "Parse BO_ (message definitions)",
          "Parse SG_ (signal definitions)",
          "Store message ID, name, DLC",
          "Store signal: name, start bit, length, byte order, scale, offset",
          "Basic parsing (don't need 100% DBC spec support)"
        ],
        "acceptanceCriteria": [
          "Loads simple DBC file",
          "Extracts messages with ID, name, DLC",
          "Extracts signals with all parameters",
          "Can look up message by ID",
          "Can look up signal by name within message",
          "Example: parse, then decode CAN frame using definitions"
        ],
        "technicalHints": [
          "DBC format: text-based, line-oriented",
          "BO_ <ID> <Name>: <DLC> <Sender>",
          "SG_ <Signal> : <StartBit>|<Length>@<ByteOrder><ValueType> ...",
          "Use std::regex or manual parsing (regex easier but slower)",
          "Store in: std::map<uint32_t, Message>, Message has vector<Signal>",
          "ByteOrder: 0=big endian, 1=little endian"
        ],
        "estimatedTime": "7-8 hours",
        "domainConnection": "AUTOSAR - DBC is the de facto standard for vehicle network definitions"
      },
      {
        "day": 14,
        "id": "SYS",
        "title": "Parse Ethernet Frames with VLAN Support",
        "priority": "Medium",
        "storyPoints": 5,
        "description": "Parse Ethernet frames including 802.1Q VLAN tags, which are used in  automotive Ethernet (TSN) for real-time communication in ADAS systems.",
        "requirements": [
          "Parse Ethernet II frame header",
          "Extract: dest MAC, src MAC, EtherType",
          "Handle VLAN tag (802.1Q): PCP, DEI, VID",
          "Identify payload type (IPv4, IPv6, ARP)",
          "Read from raw socket or pcap file"
        ],
        "acceptanceCriteria": [
          "Parses Ethernet frame from byte array",
          "Extracts all header fields correctly",
          "Detects VLAN tagged frames",
          "Identifies payload protocol",
          "Example: read pcap file, display frame info",
          "Handles jumbo frames (>1500 bytes)"
        ],
        "technicalHints": [
          "Ethernet header: 14 bytes (6 dest MAC, 6 src MAC, 2 EtherType)",
          "VLAN tag: 0x8100 EtherType, then 2 bytes tag control, 2 bytes type",
          "Use struct with __attribute__((packed)) or #pragma pack",
          "EtherType: 0x0800=IPv4, 0x86DD=IPv6, 0x0806=ARP",
          "Consider using libpcap for capture, or parse from file"
        ],
        "estimatedTime": "5-6 hours",
        "domainConnection": "AUTOSAR Adaptive/SOME-IP - Automotive Ethernet used in modern vehicle architectures"
      }
    ]
  },
  {
    "phase": 5,
    "title": "AUTOSAR ARCHITECTURE",
    "description": "Build simplified AUTOSAR components",
    "tasks": [
      {
        "day": 15,
        "id": "SYS",
        "title": "AUTOSAR RTE Sender-Receiver Port Simulator",
        "priority": "High",
        "storyPoints": 7,
        "description": "Simulate AUTOSAR RTE (Runtime Environment) sender-receiver communication. The RTE is the middleware layer that connects AUTOSAR Software Components.",
        "requirements": [
          "Define sender and receiver ports",
          "send() copies data to shared buffer",
          "receive() reads data from buffer",
          "Support for different communication semantics: explicit/implicit",
          "Queued and unqueued communication",
          "COM callbacks on data reception"
        ],
        "acceptanceCriteria": [
          "Port<T> template for typed communication",
          "SenderPort::send(data) and ReceiverPort::receive()",
          "Unqueued: only latest value stored",
          "Queued: FIFO of N elements",
          "Example: two \"runnables\" communicating via ports",
          "Demonstrate data consistency guarantees"
        ],
        "technicalHints": [
          "Port has name and type",
          "Unqueued: single T value + mutex",
          "Queued: std::queue<T> + mutex (or lock-free queue from Day 9)",
          "Send: lock, write, unlock (or copy to queue)",
          "Receive: lock, read, unlock",
          "Implicit send: automatic at end of runnable",
          "Explicit send: manual via API call"
        ],
        "estimatedTime": "7-8 hours",
        "domainConnection": "AUTOSAR RTE - Core communication mechanism between Software Components"
      },
      {
        "day": 16,
        "id": "SYS",
        "title": "AUTOSAR Runnable Scheduling Simulator",
        "priority": "High",
        "storyPoints": 8,
        "description": "Simulate AUTOSAR OS task scheduling with runnables. A task can contain  multiple runnables that execute based on events or timing.",
        "requirements": [
          "Runnables with: name, period (10ms, 20ms, etc.), execution function",
          "Tasks with priority that contain runnables",
          "Time-triggered runnables (periodic)",
          "Event-triggered runnables (on data reception)",
          "Simulate preemption based on task priority"
        ],
        "acceptanceCriteria": [
          "Register runnables with periods (e.g., 10ms, 100ms)",
          "Scheduler executes runnables at correct times",
          "Higher priority tasks preempt lower priority",
          "Measure execution times and detect overruns",
          "Example: 3 tasks with different periods and priorities",
          "Visualize execution timeline (Gantt chart or log)"
        ],
        "technicalHints": [
          "Discrete event simulation with time steps (1ms granularity)",
          "Ready queue sorted by priority (reuse Day 11 scheduler)",
          "Each task has: priority, list of runnables, state",
          "Runnable: next_activation_time, period, execution_function",
          "At each time step: check which runnables should activate",
          "Execute highest priority ready task's runnable",
          "Track CPU utilization and deadline misses"
        ],
        "estimatedTime": "8-10 hours",
        "domainConnection": "AUTOSAR OS - Simulates real AUTOSAR task and runnable scheduling"
      },
      {
        "day": 17,
        "id": "SYS",
        "title": "AUTOSAR-Style Mode Manager",
        "priority": "Medium",
        "storyPoints": 6,
        "description": "Implement a mode manager similar to AUTOSAR's BswM (Basic Software Mode Manager). Modes represent vehicle states (Startup, Running, Sleep, etc.) and control  which software components are active.",
        "requirements": [
          "Define modes and transitions",
          "Mode switch notifications to subscribers",
          "Mode-dependent activation/deactivation of runnables",
          "Transition validation rules",
          "Mode switch synchronization across partitions"
        ],
        "acceptanceCriteria": [
          "Register modes: Startup, Normal, PowerSave, Shutdown",
          "requestModeSwitch(newMode) triggers transition",
          "Subscribers notified on mode change",
          "Can enable/disable components based on mode",
          "Example: ECU startup sequence with mode transitions",
          "Handles invalid transitions gracefully"
        ],
        "technicalHints": [
          "Current mode stored as enum",
          "Transition table: map<pair<Mode,Mode>, function<bool()>> for validation",
          "Subscribers: vector<function<void(Mode)>> callbacks",
          "Mode switch: validate, change mode, notify subscribers",
          "Consider state pattern or state machine from Day 3",
          "AUTOSAR BswM controls COM, diagnostic, network management"
        ],
        "estimatedTime": "6-7 hours",
        "domainConnection": "AUTOSAR BswM - Central mode coordination in vehicle software architecture"
      },
      {
        "day": 18,
        "id": "SYS",
        "title": "AUTOSAR DEM-Style Fault Storage",
        "priority": "Medium",
        "storyPoints": 7,
        "description": "Build a simplified Diagnostic Event Manager (DEM) that stores fault codes similar to AUTOSAR DEM. When vehicle systems detect faults, they report  to DEM which stores them in non-volatile memory.",
        "requirements": [
          "Report events with: Event ID, status (failed/passed)",
          "Store in memory (simulate NVRAM)",
          "Fault counters (number of occurrences)",
          "Aging mechanism (clear after N consecutive passes)",
          "Status byte (test failed, confirmed DTC, warning indicator)",
          "UDS service 0x19 response simulation (read DTCs)"
        ],
        "acceptanceCriteria": [
          "reportEvent(eventId, status) API",
          "Stores event with timestamp and occurrence counter",
          "getStoredDTCs() returns list of confirmed faults",
          "Aging: after 40 passed tests, clear fault",
          "Fault priority levels (immediate vs debounced)",
          "Example: simulate sensor faults and retrieval"
        ],
        "technicalHints": [
          "DTC (Diagnostic Trouble Code): 3-byte code (e.g., P0420)",
          "Status byte: bits for test_failed, confirmed, warning_indicator, etc.",
          "Storage: map<EventId, EventMemoryEntry>",
          "EventMemoryEntry: counter, status, timestamp, aging_counter",
          "Debouncing: require N consecutive failures before confirming",
          "UDS 0x19: returns list of DTCs with status"
        ],
        "estimatedTime": "7-8 hours",
        "domainConnection": "AUTOSAR DEM - Fault management and OBD-II compliance in vehicles"
      }
    ]
  },
  {
    "phase": 6,
    "title": "LLVM & STATIC ANALYSIS",
    "description": "Build tools to analyze code",
    "tasks": [
      {
        "day": 19,
        "id": "SYS",
        "title": "Clang AST Visitor for Function Complexity",
        "priority": "High",
        "storyPoints": 7,
        "description": "Write a Clang tool that walks the Abstract Syntax Tree (AST) and  calculates cyclomatic complexity of functions. This is the foundation  for static analysis tools used to enforce MISRA C++ rules.",
        "requirements": [
          "Use Clang's AST API (RecursiveASTVisitor)",
          "Visit all function declarations",
          "Count: branches (if/else), loops, case statements",
          "Calculate cyclomatic complexity: V(G) = E - N + 2P",
          "Report functions exceeding complexity threshold"
        ],
        "acceptanceCriteria": [
          "Compiles with Clang libraries",
          "Parses C++ source file and builds AST",
          "Visits all function definitions",
          "Counts decision points correctly",
          "Outputs: function name, line number, complexity score",
          "Example: analyze your previous projects"
        ],
        "technicalHints": [
          "Include: clang/AST/RecursiveASTVisitor.h",
          "Inherit from RecursiveASTVisitor<YourVisitor>",
          "Override VisitFunctionDecl(), VisitIfStmt(), VisitWhileStmt(), etc.",
          "Cyclomatic complexity: 1 + number of decision points",
          "Decision points: if, while, for, case, &&, ||, catch, ?:",
          "Build with: clang++ -lclang -lclangAST -lclangBasic ..."
        ],
        "estimatedTime": "7-9 hours",
        "domainConnection": "LLVM/Static Analysis - Foundation for MISRA C++ compliance checkers"
      },
      {
        "day": 20,
        "id": "SYS",
        "title": "Simple Language to LLVM IR Compiler",
        "priority": "High",
        "storyPoints": 8,
        "description": "Write a tiny compiler for a simple expression language that generates  LLVM IR. This teaches how compilers work and how to use LLVM's code  generation APIs.",
        "requirements": [
          "Parse simple expressions: x = 1 + 2 * 3",
          "Support: integers, +, -, *, /, variables",
          "Generate LLVM IR using IRBuilder",
          "JIT execute using LLVM's ExecutionEngine",
          "Print results"
        ],
        "acceptanceCriteria": [
          "Parses arithmetic expressions with operator precedence",
          "Generates valid LLVM IR",
          "Can compile and execute: x = 5; y = x * 2 + 3;",
          "Supports function definitions (bonus)",
          "Outputs human-readable LLVM IR",
          "JIT execution produces correct results"
        ],
        "technicalHints": [
          "Use LLVM's IRBuilder for code generation",
          "LLVMContext, Module, Function, BasicBlock",
          "IRBuilder methods: CreateAdd, CreateMul, CreateStore, CreateLoad",
          "Simple recursive descent parser for expressions",
          "Store variables in map<string, AllocaInst*>",
          "Follow LLVM tutorial \"My First Language Frontend with LLVM\""
        ],
        "estimatedTime": "8-10 hours",
        "domainConnection": "LLVM - Compiler infrastructure used in automotive toolchains"
      },
      {
        "day": 21,
        "id": "SYS",
        "title": "LLVM Pass for Null Pointer Analysis",
        "priority": "High",
        "storyPoints": 8,
        "description": "Write an LLVM analysis pass that detects potential null pointer  dereferences. This is a real static analysis technique used in  automotive software validation.",
        "requirements": [
          "LLVM FunctionPass or ModulePass",
          "Track pointer values through basic blocks",
          "Detect when nullptr might be dereferenced",
          "Handle: direct assignment, function returns, conditionals",
          "Report: file, line, pointer name"
        ],
        "acceptanceCriteria": [
          "Loads as LLVM pass: opt -load pass.so -nullcheck < input.bc",
          "Detects obvious null dereferences",
          "Handles basic control flow (if checks)",
          "Low false positive rate on test cases",
          "Outputs warnings with source locations",
          "Example: analyze real C++ code for null pointer bugs"
        ],
        "technicalHints": [
          "Inherit from FunctionPass",
          "Override runOnFunction(Function &F)",
          "Iterate basic blocks and instructions",
          "Track pointer state: Unknown, Null, NonNull, MaybeNull",
          "Update state on: store, load, icmp (if (ptr != nullptr))",
          "Warn on: load/store/call through MaybeNull or Null pointer",
          "Use getDebugLoc() for source location info"
        ],
        "estimatedTime": "8-10 hours",
        "domainConnection": "Static Analysis - Used in automotive for MISRA compliance and bug detection"
      },
      {
        "day": 22,
        "id": "SYS",
        "title": "LLVM Dead Code Elimination Optimization",
        "priority": "Medium",
        "storyPoints": 7,
        "description": "Implement a basic dead code elimination (DCE) pass that removes  unreachable code and unused computations. This is a core compiler  optimization.",
        "requirements": [
          "LLVM FunctionPass",
          "Detect unreachable basic blocks",
          "Remove instructions with no uses",
          "Iterate until fixed point (no more changes)",
          "Preserve side-effecting operations (calls, stores)"
        ],
        "acceptanceCriteria": [
          "Removes unreachable basic blocks",
          "Removes unused local variables",
          "Doesn't remove volatile loads/stores",
          "Doesn't remove function calls (may have side effects)",
          "Verify correctness: output program behaves identically",
          "Measure: % of instructions eliminated"
        ],
        "technicalHints": [
          "Mark reachable blocks starting from entry block (DFS/BFS)",
          "Delete unreachable blocks",
          "For each instruction: if (inst->use_empty() && !hasSideEffects())",
          "Side effects: calls, stores, volatile loads, atomic ops",
          "Use inst->eraseFromParent() to delete",
          "Iterate until no changes (fixed point algorithm)"
        ],
        "estimatedTime": "7-8 hours",
        "domainConnection": "LLVM - Compiler optimization used in automotive embedded toolchains"
      }
    ]
  },
  {
    "phase": 7,
    "title": "ADVANCED AUTOMOTIVE",
    "description": "Real-world automotive system implementations",
    "tasks": [
      {
        "day": 23,
        "id": "SYS",
        "title": "AUTOSAR Adaptive SOME/IP-SD Parser",
        "priority": "High",
        "storyPoints": 8,
        "description": "Implement a simplified SOME/IP Service Discovery message parser. SOME/IP is the communication protocol for AUTOSAR Adaptive (service-oriented  architecture) used in ADAS and autonomous vehicle systems.",
        "requirements": [
          "Parse SOME/IP header: Service ID, Method ID, Length, etc.",
          "Parse SOME/IP-SD entries: FindService, OfferService",
          "Handle options: IPv4 Endpoint, IPv6 Endpoint",
          "Build/serialize messages",
          "Basic service registry (offered services)"
        ],
        "acceptanceCriteria": [
          "Parses SOME/IP header from byte stream",
          "Extracts SD entries (Find/Offer/Subscribe)",
          "Parses endpoint options (IP + port)",
          "Can build OfferService message",
          "Maintains registry of available services",
          "Example: service provider sends Offer, client sends Find"
        ],
        "technicalHints": [
          "SOME/IP header: 16 bytes (Service ID, Method ID, Length, Client ID, etc.)",
          "SD message type: 0x8100 (Service Discovery)",
          "Entries: type (Find=0x00, Offer=0x01), service ID, instance ID",
          "Options: type, length, IP address, port",
          "Use packed structs: #pragma pack(1) or __attribute__((packed))",
          "Network byte order: htons/htonl for serialization"
        ],
        "estimatedTime": "8-10 hours",
        "domainConnection": "AUTOSAR Adaptive - Service-oriented communication in next-gen vehicle architectures"
      },
      {
        "day": 24,
        "id": "SYS",
        "title": "Worst-Case Execution Time Certifiable Allocator",
        "priority": "High",
        "storyPoints": 7,
        "description": "Design a memory allocator where worst-case allocation time can be proven  for ISO 26262 certification. This requires completely deterministic behavior  with no variable-time operations.",
        "requirements": [
          "Multiple fixed-size pools (16, 32, 64, 128, 256 bytes)",
          "allocate(size) picks appropriate pool",
          "O(1) allocation guaranteed (no loops with variable iterations)",
          "Instrumentation to measure actual timing",
          "Documentation for timing analysis"
        ],
        "acceptanceCriteria": [
          "Supports sizes up to 256 bytes via pools",
          "Larger allocations return nullptr or use fallback",
          "No loops with data-dependent iteration count",
          "Timing measurements: min, max, average, jitter",
          "Max allocation time < 200ns on reference hardware",
          "Documentation suitable for WCET analysis tool"
        ],
        "technicalHints": [
          "5 separate pool allocators (from Day 4)",
          "size_to_pool_index: if/else chain or lookup table (not loop)",
          "Each pool: O(1) free list operations only",
          "Measure with: std::chrono::high_resolution_clock",
          "Run 100k iterations, track max time",
          "Consider cache effects (first access vs subsequent)",
          "aiT or other WCET tools for formal analysis"
        ],
        "estimatedTime": "7-8 hours",
        "domainConnection": "ISO 26262 - Safety certification requires provable timing bounds"
      },
      {
        "day": 25,
        "id": "SYS",
        "title": "CAN Transport Protocol for Diagnostic Messages",
        "priority": "High",
        "storyPoints": 8,
        "description": "Implement ISO 15765 (CAN-TP) which allows sending messages larger than  8 bytes over CAN by fragmenting across multiple frames. This is used for  UDS diagnostics.",
        "requirements": [
          "Single-frame messages (SF): up to 7 data bytes",
          "Multi-frame messages: First Frame (FF) + Consecutive Frames (CF)",
          "Flow control (FC) messages",
          "Segmentation and reassembly",
          "Timeout handling"
        ],
        "acceptanceCriteria": [
          "Sends single-frame messages directly",
          "Segments large messages into FF + multiple CFs",
          "Receiver reassembles multi-frame messages",
          "Flow control: wait, continue, overflow",
          "Handles timeouts (N_As, N_Bs, N_Cr)",
          "Example: send 200-byte diagnostic request/response"
        ],
        "technicalHints": [
          "CAN frame: [N_PCI | data...]",
          "N_PCI (Network Protocol Control Info): type + metadata",
          "SF: [0x0N | 6 bytes data], N = data length",
          "FF: [0x1F NN | 6 bytes data], 0xFNN = total length (12-bit)",
          "CF: [0x2N | 7 bytes data], N = sequence number (0-15)",
          "FC: [0x30 | BS | STmin], BS=block size, STmin=min separation time",
          "State machine: IDLE, SENDING, RECEIVING, WAIT_FC"
        ],
        "estimatedTime": "8-10 hours",
        "domainConnection": "UDS/Diagnostics - Required for vehicle diagnostics over CAN"
      },
      {
        "day": 26,
        "id": "SYS",
        "title": "AUTOSAR E2E (End-to-End) Protection Profile",
        "priority": "High",
        "storyPoints": 7,
        "description": "Implement AUTOSAR E2E protection which adds CRC and sequence counters  to messages to detect communication errors in safety-critical systems.",
        "requirements": [
          "E2E Profile 1 or 2 (choose one)",
          "Add: Counter, CRC, DataID to message",
          "Protect(): calculate CRC, add counter",
          "Check(): verify CRC, check counter sequence",
          "Detect: lost messages, repeated messages, corrupted data"
        ],
        "acceptanceCriteria": [
          "Protect() adds E2E header to message",
          "Check() validates E2E header",
          "Detects corrupted data (bit flip)",
          "Detects lost messages (counter gap)",
          "Detects repeated messages (duplicate counter)",
          "Example: simulate communication errors and detect them"
        ],
        "technicalHints": [
          "E2E Profile 1: Counter (4 bits) + CRC (8 bits) + DataID",
          "CRC: use CRC-8 (polynomial 0x1D)",
          "Counter: 0-14, wraps around, 15 = invalid",
          "DataID: unique identifier for message type",
          "Check sequence: counter = (prev + 1) % 15",
          "Error states: OK, REPEATED, WRONG_SEQUENCE, CORRUPTED",
          "AUTOSAR spec: E2E_P01, E2E_P02"
        ],
        "estimatedTime": "7-8 hours",
        "domainConnection": "AUTOSAR E2E - Safety mechanism for ASIL-rated communication"
      }
    ]
  },
  {
    "phase": 8,
    "title": "CAPSTONE PROJECTS",
    "description": "Integrate everything into complete systems",
    "tasks": [
      {
        "day": "27-28",
        "id": "SYS",
        "title": "Integrated AUTOSAR Classic Components",
        "priority": "Very High",
        "storyPoints": 13,
        "description": "Integrate previous components into a mini AUTOSAR Classic platform with: - OS task scheduling with runnables - RTE port communication - COM layer with CAN sending/receiving - Mode management - DEM for fault storage  This demonstrates understanding of complete AUTOSAR architecture.",
        "requirements": [
          "3 Software Components (SWC) communicating via RTE",
          "OS scheduler executing runnables at different rates",
          "CAN messages sent/received via COM",
          "Mode switches triggering component activation",
          "Fault reporting to DEM"
        ],
        "acceptanceCriteria": [
          "Define 3 SWCs with sender/receiver ports",
          "RTE connects ports between SWCs",
          "OS schedules runnables: 10ms, 20ms, 100ms",
          "COM sends CAN message every 100ms with data from SWC",
          "Mode manager controls which SWCs are active",
          "DEM stores faults reported by SWCs",
          "Runs simulation for 10 seconds, logs all activity"
        ],
        "technicalHints": [
          "Reuse: Day 15 RTE, Day 16 Scheduler, Day 12 CAN, Day 17 Mode, Day 18 DEM",
          "SWC examples: Sensor reader, Controller, Actuator",
          "Main loop: advance time, schedule tasks, process CAN, check modes",
          "Configuration: define which runnable in which task, port connections",
          "Output: execution trace showing component interactions"
        ],
        "estimatedTime": "12-16 hours (2 days)",
        "domainConnection": "AUTOSAR Classic - Complete ECU software architecture"
      },
      {
        "day": "29-30",
        "id": "SYS",
        "title": "MISRA C++ Rule Checker using Clang",
        "priority": "Very High",
        "storyPoints": 13,
        "description": "Build a static analysis tool that checks several MISRA C++ rules using  Clang's AST. MISRA C++ is mandatory for automotive safety-critical code.",
        "requirements": [
          "Check at least 5 MISRA rules (choose from categories)",
          "Use Clang AST visitor pattern",
          "Report violations with: rule number, severity, location",
          "Generate HTML report",
          "Run on your previous projects",
          "SUGGESTED RULES:",
          "Rule 5-0-3: Casts shall not remove const",
          "Rule 6-4-5: Unconditional throw must not appear in iteration statement",
          "Rule 15-5-1: Throw by value, catch by reference",
          "Rule 18-4-1: Don't use time functions from <ctime>",
          "Rule 8-5-2: Braces shall be used for if/else/while bodies"
        ],
        "acceptanceCriteria": [
          "Detects violations of 5+ MISRA rules",
          "Reports: file, line, column, rule number, description",
          "Low false positive rate (< 10% on test code)",
          "Processes all .cpp files in directory",
          "Generates readable HTML report",
          "Example: analyze automotive codebase"
        ],
        "technicalHints": [
          "Extend Day 19 AST visitor",
          "Add VisitCastExpr, VisitThrowExpr, VisitCatchStmt, etc.",
          "Check AST node properties for rule violations",
          "Store violations in vector<Violation>",
          "Generate HTML: iterate violations, format as table",
          "Use clang::SourceLocation for file/line info",
          "Consider clang-tidy architecture for reference"
        ],
        "estimatedTime": "12-16 hours (2 days)",
        "domainConnection": "MISRA C++/Safety - Mandatory static analysis for automotive code certification"
      }
    ]
  },
  {
    "phase": 9,
    "title": "CAMPAGNARO COURSE & DESERT PREP",
    "description": "Focused tasks for C++ multithreading, mutex, sockets, and DESERT/Hydromea integration",
    "tasks": [
      {
        "day": "Extra-01",
        "id": "CAMP",
        "title": "Robust TCP Echo Server and Client (POSIX Sockets)",
        "priority": "High",
        "storyPoints": 5,
        "description": "Implement a simple but production-style TCP echo server and client using POSIX sockets on Linux. Focus on correct error handling, clean shutdown, and separation between networking and application logic.",
        "requirements": [
          "TCP server listening on configurable IP/port",
          "Accept multiple clients sequentially (no threads yet)",
          "For each connected client: read data, echo back, handle partial reads/writes",
          "Clean shutdown on SIGINT (Ctrl+C)",
          "Proper error checking and logging"
        ],
        "acceptanceCriteria": [
          "Server and client binaries build and run on Ubuntu",
          "Client can send arbitrary lines and receive exact echo",
          "Handles partial reads/writes (no assumptions about recv()/send() sizes)",
          "Handles client disconnects gracefully (no crashes)",
          "On SIGINT, server stops accepting new connections and exits cleanly",
          "Clear separation between socket API wrapper and main logic"
        ],
        "technicalHints": [
          "Use ::socket, ::bind, ::listen, ::accept, ::connect, ::recv, ::send, ::close",
          "Implement read_exact() and write_all() helper functions",
          "Use getaddrinfo() for flexible address resolution",
          "Use sigaction() to catch SIGINT and set a shutdown flag"
        ],
        "estimatedTime": "4-5 hours",
        "domainConnection": "Campagnaro course / sockets - Foundation for all networked components and DESERT-side TCP/UDP interfacing"
      },
      {
        "day": "Extra-02",
        "id": "CAMP",
        "title": "Thread-Pooled TCP Server with Graceful Shutdown",
        "priority": "High",
        "storyPoints": 6,
        "description": "Extend the TCP echo server to handle multiple clients concurrently using a thread pool. Focus on safe use of std::thread, std::mutex, and condition variables, with a clean shutdown protocol.",
        "requirements": [
          "Main thread accepts connections and enqueues them",
          "Fixed-size worker thread pool handles client sessions",
          "Shared queue protected with mutex + condition variable",
          "Graceful shutdown: stop accepting, drain queue, join workers",
          "Structured logging of connection lifecycle"
        ],
        "acceptanceCriteria": [
          "Can serve multiple clients in parallel (e.g., 10 telnet sessions)",
          "No data races (ThreadSanitizer clean)",
          "No resource leaks (sockets, threads) on shutdown",
          "Shutdown sequence is deterministic and documented",
          "Worker threads exit reliably even under load"
        ],
        "technicalHints": [
          "Reuse your thread pool design from SYS-006 / SYS-011 if available",
          "Connection job = lambda owning the client socket fd",
          "Use a stop_flag + notify_all() to wake workers during shutdown",
          "Carefully define lifecycle: accept loop, enqueue, worker loop, stop"
        ],
        "estimatedTime": "5-7 hours",
        "domainConnection": "Campagnaro course / multithreading+mutex - Mirrors the kind of concurrent socket handling needed in DESERT device adapters"
      },
      {
        "day": "Extra-03",
        "id": "CAMP",
        "title": "Simple Reliable Protocol over UDP (Framing + ACK/Retry)",
        "priority": "High",
        "storyPoints": 7,
        "description": "Build a small reliability layer over UDP: add message framing, sequence numbers, ACKs, and retransmissions. This models how a modem or underwater link might be abstracted in software.",
        "requirements": [
          "Client sends numbered messages to server over UDP",
          "Server sends ACKs with received sequence numbers",
          "Client retransmits if ACK not received within timeout",
          "Detect and log loss, duplicates, and reordering",
          "Optional: sliding window instead of stop-and-wait"
        ],
        "acceptanceCriteria": [
          "Messages delivered reliably under simulated packet loss (use iptables/netem or drop randomly in code)",
          "No infinite retransmission loops (max retry limit)",
          "Proper handling of duplicate ACKs and late packets",
          "Clear on-wire frame format documented (header + payload)",
          "Statistics at end: sent, retransmitted, lost, delivered"
        ],
        "technicalHints": [
          "UDP: ::socket(AF_INET, SOCK_DGRAM, 0), ::sendto, ::recvfrom",
          "Header struct: seq_num (uint32_t), type (DATA/ACK), length, CRC (optional)",
          "Use std::chrono for timeouts and steady_clock for reliability",
          "Consider using select()/poll() for timeout-based waiting"
        ],
        "estimatedTime": "6-8 hours",
        "domainConnection": "Campagnaro course / sockets + DESERT - Models the kind of reliability logic used between DESERT stack and real modems"
      },
      {
        "day": "Extra-04",
        "id": "CAMP",
        "title": "DESERT Underwater Framework: Build, Run, and Map the Architecture",
        "priority": "High",
        "storyPoints": 5,
        "description": "Set up the DESERT Underwater framework on Ubuntu, build it, and run at least two example scenarios. Produce a concise architecture note focusing on where a Hydromea modem interface would fit.",
        "requirements": [
          "Clone DESERT_Underwater and its documented dependencies",
          "Build on your Ubuntu environment (VM or remote)",
          "Run at least 2 official examples/tutorial scenarios successfully",
          "Identify where applications, modems, and channels are modeled",
          "Write a short ARCHITECTURE.md summarizing layers and extension points"
        ],
        "acceptanceCriteria": [
          "DESERT builds without local hacks (or hacks are well-documented)",
          "Two scenarios run and produce expected logs/results",
          "Clear diagram: application layer \u2192 protocol stack \u2192 physical/modem abstraction",
          "List of candidate files/classes for adding a new \"Hydromea\" interface",
          "Notes on build system (Make/CMake/ns-2 integration) and runtime configuration"
        ],
        "technicalHints": [
          "Follow official DESERT documentation and installation guide",
          "Pay attention to ns-miracle/ns-2 dependencies and paths",
          "Use dot/graphviz or ASCII diagrams for architecture mapping",
          "Capture commands you run in a shell script or notes for reproducibility"
        ],
        "estimatedTime": "5-7 hours",
        "domainConnection": "DESERT / Campagnaro research - Direct preparation for understanding where to plug in a real modem interface"
      },
      {
        "day": "Extra-05",
        "id": "CAMP",
        "title": "Hydromea-Style Modem Adapter Interface (Abstraction Only)",
        "priority": "High",
        "storyPoints": 7,
        "description": "Design and implement a C++ interface and mock implementation that represents a generic underwater modem, with operations like connect, send_frame, receive_frame, and link status. Focus on clean API boundaries and threading model.",
        "requirements": [
          "Define abstract ModemInterface class with pure virtual methods",
          "Provide a MockModem implementation that simulates latency, loss, and bit errors",
          "Thread-safe send/receive with internal worker thread handling I/O or simulation",
          "Callbacks or observer mechanism for received frames and status changes",
          "Configurable parameters: latency, loss rate, bandwidth"
        ],
        "acceptanceCriteria": [
          "Clear header-only interface (ModemInterface.hpp) documenting responsibilities",
          "Mock implementation can be used from a single-threaded test program safely",
          "Thread-safe internals (no data races under stress test)",
          "Simulation parameters demonstrably affect delay/loss behavior",
          "Easily pluggable into a DESERT-like application module in the future"
        ],
        "technicalHints": [
          "Use std::thread + std::mutex + std::condition_variable internally",
          "Consider a background thread that pops from a queue and \"delivers\" frames after a delay",
          "Use std::function callbacks for on_frame_received and on_status_changed",
          "This task is about API and concurrency design, not real hardware I/O yet"
        ],
        "estimatedTime": "6-8 hours",
        "domainConnection": "DESERT / Hydromea project - Direct precursor to a real Hydromea LUMA-X adapter, isolating modem specifics behind a clean interface"
      },
      {
        "day": "Extra-06",
        "id": "CAMP",
        "title": "TCP/UDP Socket-Based Modem Adapter Prototype",
        "priority": "Very High",
        "storyPoints": 9,
        "description": "Implement a concrete ModemInterface that talks over TCP or UDP sockets to a remote endpoint (simulating or replacing a real Hydromea modem process). Focus on robust multithreading and error handling.",
        "requirements": [
          "Implement SocketModemAdapter : ModemInterface",
          "Internal RX/TX threads for reading/writing from/to the socket",
          "Frame-based protocol on top of TCP or UDP (reuse EXTRA-03 framing ideas)",
          "Reconnect logic on connection loss with backoff",
          "Clean shutdown that terminates threads and closes sockets safely"
        ],
        "acceptanceCriteria": [
          "Adapter can connect to a simple test peer and exchange framed messages",
          "RX/TX threads terminate cleanly on shutdown (no hangs, no leaks)",
          "Handles connection drops and reconnection attempts gracefully",
          "High-load test (many frames) passes TSAN/ASAN checks",
          "Ready to be integrated into a DESERT application as a \"real\" modem backend"
        ],
        "technicalHints": [
          "Compose this from CAMP-001/002 (server/client) and EXTRA-03 (framing)",
          "Careful with lifetime: ensure threads don't access destroyed objects",
          "Use an explicit state machine for connection state (CONNECTED, RECONNECTING, STOPPING)",
          "Add extensive logging with timestamps and thread IDs"
        ],
        "estimatedTime": "8-12 hours",
        "domainConnection": "DESERT / Hydromea project - Prototype of the actual interfacing logic the professor described (multithreading + sockets)"
      },
      {
        "day": "Extra-07",
        "id": "CAMP",
        "title": "Simulated Exam Task: Concurrency + Sockets Under Time Pressure",
        "priority": "High",
        "storyPoints": 6,
        "description": "Create a mini \"exam simulator\" for yourself: set a 3\u20134 hour timer and implement a small program combining threads, mutexes, and sockets, following a short written specification. Treat it as if it were the actual exam.",
        "requirements": [
          "Write your own 1-page problem statement (e.g., multi-client chat server with message history)",
          "Implement from scratch in a clean new repo, no copy-paste from old code",
          "Use at least: std::thread, std::mutex/std::lock_guard, condition_variable, and TCP sockets",
          "At the end, write a short self-review: what went well, what failed under time pressure"
        ],
        "acceptanceCriteria": [
          "You respect a hard time limit (3\u20134 hours max)",
          "The resulting program compiles and runs, even if not perfectly polished",
          "You identify at least 3 concrete weaknesses or patterns to improve before the real exam",
          "You push the code and the self-review to Git with a clear tag (e.g., exam-sim-01)"
        ],
        "technicalHints": [
          "Simulate the real exam conditions: no AI, only man pages, cppreference, and your notes",
          "Keep the spec small but non-trivial (one synchronization bug is enough to teach you a lot)",
          "Use this to tune your personal exam strategy (design first vs. code first)"
        ],
        "estimatedTime": "4 hours (single session)",
        "domainConnection": "Campagnaro exam prep - Trains the exact combination of skills (C++, threads, sockets, discipline) needed for the oral+programming exam"
      },
      {
        "day": "Extra-08",
        "id": "CAMP",
        "title": "DESERT Scenario Design for Hydromea LUMA-X Integration (Design Document)",
        "priority": "Medium",
        "storyPoints": 4,
        "description": "Without writing code yet, design a DESERT simulation scenario that uses your ModemInterface/SocketModemAdapter concept to represent a Hydromea LUMA-X UV optical modem link. Produce a short design document only.",
        "requirements": [
          "Identify which DESERT modules/classes would interact with the modem adapter",
          "Define the configuration options (IP/port, latency, data rate, loss model)",
          "Describe how control messages (init, status, errors) would be modeled",
          "Sketch message flows: application \u2192 DESERT stack \u2192 modem adapter \u2192 remote modem",
          "Outline a test plan: what experiments/metrics to run once implemented"
        ],
        "acceptanceCriteria": [
          "2\u20133 page DESIGN.md with diagrams and clear text",
          "Explicit mapping from DESERT building blocks to your adapter interface",
          "At least 3 example experiments (throughput, latency under loss, reconnect behavior)",
          "Ready to discuss with the professor as a concrete proposal for the 2 CFU project"
        ],
        "technicalHints": [
          "Reuse knowledge from EXTRA-04 (DESERT architecture)",
          "Read the Hydromea LUMA-X manual to understand capabilities and constraints",
          "Focus on clarity and feasibility, not implementation yet"
        ],
        "estimatedTime": "3-4 hours",
        "domainConnection": "DESERT / Hydromea project - Bridges your self-study work with a concrete, discussable research activity proposal"
      }
    ]
  }
];
