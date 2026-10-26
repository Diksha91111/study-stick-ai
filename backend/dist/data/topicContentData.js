"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOPIC_QUIZ_QUESTIONS = exports.TOPIC_CONTENT_DATA = void 0;
exports.TOPIC_CONTENT_DATA = {
    'Variables and data types': {
        topic: 'Variables and data types',
        title: 'Variables and Data Types',
        difficulty: 'Beginner',
        estimatedMinutes: 25,
        weightage: 'Core Foundation (15%)',
        objectives: [
            'Understand how variables represent memory locations storing data',
            'Distinguish primitive types (int, float, char, boolean) from reference types',
            'Master type conversion, type coercion, and variable scope (block, function, global)',
            'Recognize immutability vs mutability in modern programming languages'
        ],
        detailedExplanation: `Variables are symbolic names bound to physical or virtual memory locations that store values during execution. In statically typed languages (C++, Java, Rust), each variable must declare a fixed type at compile-time, allowing the compiler to optimize machine code instructions and guarantee byte sizes. In dynamically typed languages (Python, JavaScript), variable names are references pointing to heap-allocated objects whose type tags are inspected at runtime.

Understanding data types is vital because computer hardware operates on binary words. Primitive types map directly to CPU registers (e.g., 32-bit or 64-bit integers and IEEE 754 floating-point numbers). Reference types, by contrast, store the address of structured data located elsewhere in memory. When you assign or pass primitives by value, the bytes are duplicated; when passing reference types, only the memory pointer is copied, causing mutations to reflect across aliases.`,
        coreConcepts: [
            {
                name: 'Primitive vs Reference Types',
                description: 'Primitives (int, boolean, float) store direct values on the stack; reference types (objects, lists) store heap pointers.'
            },
            {
                name: 'Variable Declaration & Scope',
                description: 'Scope defines the lexical accessibility of variables: global, functional, or block-scoped (e.g., let/const in JS).'
            },
            {
                name: 'Static vs Dynamic Typing',
                description: 'Static typing checks data types at compile time (early error detection), while dynamic typing verifies types at runtime.'
            },
            {
                name: 'Type Casting & Coercion',
                description: 'Explicit casting manually transforms data types (e.g. Number("42")), while implicit coercion happens automatically during evaluation.'
            }
        ],
        examples: [
            {
                title: 'Variable Scope and Immutability',
                code: `// Primitive assignment (Value copy)
let a = 10;
let b = a;
b = 20;
console.log(a); // Output: 10 (a is unaffected)

// Reference assignment (Address copy)
const user1 = { name: 'Priya', score: 85 };
const user2 = user1;
user2.score = 95;
console.log(user1.score); // Output: 95 (user1 and user2 point to the same memory)`,
                explanation: 'Modifying primitive b creates a separate value in memory. Modifying user2 alters the shared underlying object on the heap.'
            },
            {
                title: 'Explicit vs Implicit Type Coercion',
                code: `const x = "5";
const y = 2;

// Implicit coercion (string concatenation)
console.log(x + y); // "52"

// Explicit type casting
console.log(Number(x) + y); // 7`,
                explanation: 'The plus operator favors string concatenation when one operand is a string. Explicit Number() conversion guarantees arithmetic addition.'
            }
        ],
        importantPoints: [
            'Prefer immutable constants (const) by default to prevent accidental reassignment and side-effects.',
            'Always beware of floating-point inaccuracies (e.g., 0.1 + 0.2 !== 0.3) due to binary fraction representations.',
            'Initialize variables before reading them to avoid undefined behavior or null pointer exceptions.'
        ],
        commonMistakes: [
            'Assuming that assigning an object or array creates an independent clone instead of a shallow reference copy.',
            'Using double-equals (==) instead of strict triple-equals (===), triggering unexpected type coercion bugs.',
            'Shadowing outer-scope variables with identically named inner-scope variables, leading to silent logical errors.'
        ],
        quickRevision: [
            'Variables store values in stack memory (primitives) or heap memory references (objects).',
            'Primitive types: Number, Boolean, String, Symbol, BigInt, null, undefined.',
            'const prevents variable re-binding, but properties of reference types can still be mutated.',
            'Always use explicit type casting when processing external user input.'
        ],
        learningResources: [
            {
                title: 'Memory Layout of Variables',
                type: 'Guide',
                description: 'Comprehensive deep dive into Stack vs Heap memory allocation.'
            },
            {
                title: 'MDN Web Docs: Grammar and Types',
                type: 'Documentation',
                description: 'Official standard reference for declarations, scoping, and data types.'
            }
        ]
    },
    'Conditions and loops': {
        topic: 'Conditions and loops',
        title: 'Conditions and Loops',
        difficulty: 'Beginner',
        estimatedMinutes: 30,
        weightage: 'Control Flow (15%)',
        objectives: [
            'Master branching execution paths using if-else and switch statements',
            'Implement deterministic iteration (for loops) and condition-driven iteration (while loops)',
            'Manage loop termination and jump statements (break, continue, return)',
            'Prevent infinite loops and off-by-one boundary errors'
        ],
        detailedExplanation: `Control flow statements dictate the order in which individual programming instructions are evaluated. Without control structures, computers would execute code linearly from top to bottom. Conditional branches inspect Boolean predicates to selectively execute designated blocks. 

Iterative loops repeat instructions until an exit predicate evaluates to false. Understanding the loop invariant—a condition that remains true before and after each iteration—is essential for proving correctness. Off-by-one errors (OBOE) commonly arise at interval boundaries (< vs <=), making meticulous boundary testing necessary.`,
        coreConcepts: [
            {
                name: 'Boolean Logic & Short-Circuiting',
                description: 'Logical operators (&&, ||) stop evaluation as soon as the outcome is determined without evaluating subsequent operands.'
            },
            {
                name: 'Loop Invariants & Termination',
                description: 'Ensuring loop variables strictly advance toward the termination condition to prevent infinite loops.'
            },
            {
                name: 'Break vs Continue',
                description: 'break exits the innermost enclosing loop immediately; continue skips to the next iteration step.'
            }
        ],
        examples: [
            {
                title: 'Deterministic Loop with Early Termination',
                code: `function findFirstPrime(numbers) {
  for (let i = 0; i < numbers.length; i++) {
    const n = numbers[i];
    if (n <= 1) continue; // Skip non-primes
    
    let isPrime = true;
    for (let d = 2; d * d <= n; d++) {
      if (n % d === 0) {
        isPrime = false;
        break; // Stop testing divisors
      }
    }
    
    if (isPrime) return n; // Found, return immediately
  }
  return null;
}`,
                explanation: 'Uses continue to bypass invalid numbers, break to abort factor checking early, and return to terminate the entire function upon match.'
            }
        ],
        importantPoints: [
            'Ensure every while loop modifies the loop condition variable inside its body.',
            'Prefer switch statements or lookup dictionaries over long chains of else-if for readability.',
            'Be alert to loop boundary checks: 0-indexed structures loop while index < length.'
        ],
        commonMistakes: [
            'Accidentally writing = (assignment) instead of === (equality) inside an if condition.',
            'Forgetting to increment index counters inside while loops, triggering 100% CPU lockups.',
            'Putting a semicolon right after the for (...) statement, causing an empty loop body.'
        ],
        quickRevision: [
            'if / else if / else branches based on truthy/falsy expressions.',
            'for loops are ideal when iteration count is known; while loops when stopping condition is dynamic.',
            'Short-circuit evaluation: false && anything is false without evaluating the right operand.'
        ],
        learningResources: [
            {
                title: 'Control Flow Mastery',
                type: 'Guide',
                description: 'Patterns for clean branching and loop optimization.'
            }
        ]
    },
    'Arrays and strings': {
        topic: 'Arrays and strings',
        title: 'Arrays and Strings',
        difficulty: 'Intermediate',
        estimatedMinutes: 35,
        weightage: 'Linear Data Structures (15%)',
        objectives: [
            'Understand contiguous memory representation of arrays and O(1) random index access',
            'Distinguish static contiguous arrays from dynamic resizable vectors',
            'Master string immutability, UTF-8/UTF-16 encoding, and memory overhead',
            'Implement fundamental algorithms: Two Pointers and Sliding Window'
        ],
        detailedExplanation: `Arrays are sequences of elements stored in contiguous blocks of computer memory. Because every element occupies identical byte width, the memory address of index i is calculated instantaneously using the formula: BaseAddress + (i * ElementSize), yielding O(1) random access time. However, inserting or deleting elements at arbitrary positions requires shifting elements, requiring O(n) time.

Strings are sequences of characters. In languages like JavaScript, Python, and Java, strings are immutable—any modification generates an entirely new string in memory. Concatenating strings in a loop without StringBuilder or array joins results in O(n²) time due to repeated memory reallocation.`,
        coreConcepts: [
            {
                name: 'Contiguous Memory & Indexing',
                description: 'Memory layout enables instant O(1) index lookups, but shifting on insertion/deletion costs O(n).'
            },
            {
                name: 'String Immutability',
                description: 'Characters within strings cannot be modified in-place; modifications construct new memory copies.'
            },
            {
                name: 'Two-Pointer Technique',
                description: 'Iterating two pointers toward each other or at varying speeds to solve problems in O(n) time and O(1) space.'
            }
        ],
        examples: [
            {
                title: 'Two-Pointer In-Place Array Reversal',
                code: `function reverseInPlace(arr) {
  let left = 0;
  let right = arr.length - 1;
  
  while (left < right) {
    const temp = arr[left];
    arr[left] = arr[right];
    arr[right] = temp;
    left++;
    right--;
  }
  return arr;
}`,
                explanation: 'Swaps symmetric elements in-place with O(1) auxiliary space and O(n/2) = O(n) time complexity.'
            }
        ],
        importantPoints: [
            'Dynamic arrays automatically resize (typically doubling capacity) when full, giving amortized O(1) append time.',
            'String character access by index is O(1), but slicing or copying takes O(k) where k is the slice length.'
        ],
        commonMistakes: [
            'Repeatedly concatenating strings inside a loop with += instead of collecting in an array and joining.',
            'Out of bounds indexing: reading array[array.length] instead of array[array.length - 1].'
        ],
        quickRevision: [
            'Array lookup: O(1). Insertion/Deletion at end: amortized O(1). Insertion at front/middle: O(n).',
            'Strings are immutable in JS, Python, and Java.',
            'Two pointers and sliding window provide optimal O(n) solutions for subarray problems.'
        ],
        learningResources: [
            {
                title: 'Array Mechanics & Two Pointers',
                type: 'Guide',
                description: 'In-depth guide to array memory representations and pointer paradigms.'
            }
        ]
    },
    'Searching and sorting': {
        topic: 'Searching and sorting',
        title: 'Searching and Sorting',
        difficulty: 'Intermediate',
        estimatedMinutes: 40,
        weightage: 'Core Algorithms (15%)',
        objectives: [
            'Compare Linear Search O(n) with Binary Search O(log n) on sorted arrays',
            'Understand Divide and Conquer sorting algorithms: Merge Sort and Quick Sort',
            'Evaluate stability, worst-case, and best-case time and space complexities',
            'Identify sorting trade-offs (in-place QuickSort vs stable MergeSort)'
        ],
        detailedExplanation: `Searching is finding target items within collections. Linear search inspects every element sequentially in O(n) time. When data is sorted, Binary search halves the search space at each comparison, achieving exponential speedup at O(log n) time.

Sorting arranges elements into designated order. Elementary sorts (Bubble, Selection, Insertion) run in O(n²) time. Advanced divide-and-conquer sorts achieve optimal comparison bound O(n log n). Merge Sort splits arrays into halves, sorts them recursively, and merges sorted sub-lists (guaranteed O(n log n), stable, but requires O(n) auxiliary memory). Quick Sort partitions around a pivot in-place (average O(n log n), O(1) auxiliary space, but worst-case O(n²)).`,
        coreConcepts: [
            {
                name: 'Binary Search Paradigm',
                description: 'Requires sorted input. Continuously compares middle element and discards half the array.'
            },
            {
                name: 'Stability in Sorting',
                description: 'A sorting algorithm is stable if it preserves the relative order of duplicate keys.'
            },
            {
                name: 'Divide and Conquer',
                description: 'Decomposing a problem into independent sub-problems, solving recursively, and recombining.'
            }
        ],
        examples: [
            {
                title: 'Binary Search Implementation',
                code: `function binarySearch(arr, target) {
  let low = 0;
  let high = arr.length - 1;
  
  while (low <= high) {
    const mid = Math.floor(low + (high - low) / 2); // Avoid overflow
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return -1; // Target not found
}`,
                explanation: 'Avoids integer overflow using low + (high - low) / 2. Runs in strict O(log n) time.'
            }
        ],
        importantPoints: [
            'Binary search ONLY works on sorted arrays or monotonic search spaces.',
            'Comparison-based sorting has a mathematical lower bound of Ω(n log n).',
            'QuickSort is typically faster in practice due to superior cache locality, despite worst-case O(n²).'
        ],
        commonMistakes: [
            'Using mid = (low + high) / 2 which can overflow in languages with fixed integer sizes (Java, C++).',
            'Using low < high instead of low <= high, causing binary search to miss matches at boundary elements.'
        ],
        quickRevision: [
            'Binary Search: O(log n) time, O(1) space on sorted collections.',
            'Merge Sort: O(n log n) worst-case, stable, O(n) extra space.',
            'Quick Sort: O(n log n) average, in-place O(1) space, unstable.'
        ],
        learningResources: [
            {
                title: 'Visual Sorting Algorithms',
                type: 'Guide',
                description: 'Interactive visualizer for comparisons, swaps, and recursion trees.'
            }
        ]
    },
    'Recursion': {
        topic: 'Recursion',
        title: 'Recursion',
        difficulty: 'Intermediate',
        estimatedMinutes: 35,
        weightage: 'Algorithmic Thinking (10%)',
        objectives: [
            'Understand how call stacks track recursive function frames',
            'Identify and implement mandatory base cases to prevent stack overflow',
            'Formulate recursive step transitions and recurrence relations',
            'Distinguish head recursion from tail recursion and understand tail-call optimization'
        ],
        detailedExplanation: `Recursion occurs when a function solves a computational problem by invoking smaller instances of itself. Every recursive solution requires two components:
1. Base Case: The terminating condition that returns a direct result without further recursive calls.
2. Recursive Step: The rule that reduces the problem size toward the base case.

Behind the scenes, the runtime environment pushes an execution stack frame for each call, containing local variables, parameters, and return addresses. If recursion exceeds call stack capacity (usually thousands of frames), a StackOverflowError occurs. Tail recursion places the recursive call in the final position, enabling compilers to reuse stack frames.`,
        coreConcepts: [
            {
                name: 'The Call Stack',
                description: 'LIFO structure tracking active activation frames, return addresses, and local parameters.'
            },
            {
                name: 'Base Case Verification',
                description: 'The foundation of recursive correctness; must be reachable for all possible input values.'
            },
            {
                name: 'Divide-and-Conquer Recurrence',
                description: 'Expressing running time and algorithmic structure in terms of sub-problem sizes (e.g., T(n) = 2T(n/2) + O(n)).'
            }
        ],
        examples: [
            {
                title: 'Recursive Factorial with Call Stack Trace',
                code: `function factorial(n) {
  // Base case
  if (n <= 1) return 1;
  // Recursive step
  return n * factorial(n - 1);
}

// Execution trace for factorial(3):
// Push factorial(3) -> waits for factorial(2)
// Push factorial(2) -> waits for factorial(1)
// Push factorial(1) -> hits base case, returns 1
// Pop factorial(2)  -> returns 2 * 1 = 2
// Pop factorial(3)  -> returns 3 * 2 = 6`,
                explanation: 'Each call pauses until child calls resolve, illustrating call stack winding and unwinding.'
            }
        ],
        importantPoints: [
            'Always write and verify your base case before writing recursive logic.',
            'Ensure parameters strictly converge toward the base case on every invocation.',
            'Recursion without memoization on overlapping subproblems causes exponential O(2ⁿ) blowup.'
        ],
        commonMistakes: [
            'Missing base case or incorrect termination condition, causing infinite recursion and stack overflow.',
            'Accidentally mutating global variables across recursive activation frames.'
        ],
        quickRevision: [
            'Recursion breaks a problem into identical smaller subproblems.',
            'Base case stops recursion; recursive case reduces problem size.',
            'Space complexity is proportional to maximum recursion tree depth.'
        ],
        learningResources: [
            {
                title: 'Mastering Recursion Call Stacks',
                type: 'Guide',
                description: 'Visual walkthrough of recursion trees and stack unwinding.'
            }
        ]
    },
    'Linked lists, stacks, and queues': {
        topic: 'Linked lists, stacks, and queues',
        title: 'Linked Lists, Stacks, and Queues',
        difficulty: 'Intermediate',
        estimatedMinutes: 40,
        weightage: 'Dynamic Data Structures (10%)',
        objectives: [
            'Understand pointer-based node linking in singly and doubly linked lists',
            'Implement LIFO Stack operations (push, pop, peek) in O(1) time',
            'Implement FIFO Queue operations (enqueue, dequeue) in O(1) time',
            'Apply stacks to parenthesis matching, expression parsing, and DFS'
        ],
        detailedExplanation: `Unlike contiguous arrays, Linked Lists store elements in detached nodes across memory, connected by pointers. Inserting or deleting at known node pointers runs in O(1) time without element shifting, but accessing index i requires O(n) sequential traversal.

Stacks enforce Last-In, First-Out (LIFO) discipline. Elements are pushed and popped strictly from the top in O(1) time. Stacks are fundamental for call stacks, undo mechanisms, and backtracking.

Queues enforce First-In, First-Out (FIFO) discipline. Elements enter at the rear (enqueue) and exit at the front (dequeue) in O(1) time. Queues power task schedulers, breadth-first search (BFS), and message streaming.`,
        coreConcepts: [
            {
                name: 'Node & Pointer Chaining',
                description: 'Nodes store value and next pointer. Doubly linked lists add prev pointers for bidirectional navigation.'
            },
            {
                name: 'LIFO vs FIFO Disciplines',
                description: 'Stacks prioritize the newest element; Queues preserve chronological arrival order.'
            },
            {
                name: 'Dummy Head Nodes',
                description: 'Using sentinel nodes simplifies edge-case handling for insertions/deletions at list boundaries.'
            }
        ],
        examples: [
            {
                title: 'Stack-Based Balanced Parentheses Checker',
                code: `function isValidParentheses(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  
  for (const char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else if (map[char]) {
      if (stack.pop() !== map[char]) return false;
    }
  }
  return stack.length === 0;
}`,
                explanation: 'Uses a LIFO stack to match closing brackets with their most recently opened counterpart in O(n) time and O(n) space.'
            }
        ],
        importantPoints: [
            'Losing a linked list pointer before updating it causes node disconnection and memory leaks in manual memory languages.',
            'Array-based queues must use circular buffers or linked nodes to avoid O(n) dequeue shift costs.'
        ],
        commonMistakes: [
            'Dereferencing null pointer (e.g. node.next.next when node.next is null).',
            'Forgetting to check if stack/queue is empty before calling pop or peek.'
        ],
        quickRevision: [
            'Linked list: O(1) insertion/deletion at known pointer, O(n) random access.',
            'Stack: LIFO (push, pop, peek all O(1)).',
            'Queue: FIFO (enqueue, dequeue both O(1)).'
        ],
        learningResources: [
            {
                title: 'Interactive Data Structures',
                type: 'Guide',
                description: 'Animated pointer manipulation for singly and doubly linked lists.'
            }
        ]
    },
    'Trees and graphs': {
        topic: 'Trees and graphs',
        title: 'Trees and Graphs',
        difficulty: 'Advanced',
        estimatedMinutes: 45,
        weightage: 'Hierarchical & Network Structures (10%)',
        objectives: [
            'Understand hierarchical tree properties (root, children, depth, height, leaves)',
            'Implement Binary Search Trees (BST) and understand average O(log n) operations',
            'Master Tree Traversals: In-order, Pre-order, Post-order, and Level-order (BFS)',
            'Represent graphs via Adjacency List and Adjacency Matrix and traverse with BFS/DFS'
        ],
        detailedExplanation: `Trees are non-linear, hierarchical data structures consisting of nodes connected by directed or undirected edges, containing no cycles. A Binary Tree restricts nodes to at most two children. In a Binary Search Tree (BST), every node satisfies the ordering invariant: left subtree values < node value < right subtree values, granting O(h) search time where h is tree height.

Graphs represent arbitrary relationships between vertices connected by edges. They can be directed or undirected, weighted or unweighted, cyclic or acyclic. Graph representations include Adjacency Lists (optimal for sparse graphs O(V + E) space) and Adjacency Matrices (O(V²) space, optimal for dense graphs). Graph traversals are Breadth-First Search (queue-based, finds shortest paths in unweighted graphs) and Depth-First Search (stack/recursive, explores deeply).`,
        coreConcepts: [
            {
                name: 'BST Invariant & Traversals',
                description: 'In-order traversal of a BST yields keys in strictly ascending sorted order.'
            },
            {
                name: 'Breadth-First Search (BFS)',
                description: 'Explores level-by-level using a FIFO queue; guarantees shortest path on unweighted graphs.'
            },
            {
                name: 'Depth-First Search (DFS)',
                description: 'Explores down each branch using recursion or stack; ideal for cycle detection and topological sorting.'
            }
        ],
        examples: [
            {
                title: 'BST In-Order Traversal (Sorted Output)',
                code: `class TreeNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

function inOrderTraversal(root, result = []) {
  if (!root) return result;
  inOrderTraversal(root.left, result);  // Left
  result.push(root.val);                // Visit root
  inOrderTraversal(root.right, result); // Right
  return result;
}`,
                explanation: 'Visits left subtree, root, then right subtree. Guaranteed to produce sorted order for any valid BST.'
            }
        ],
        importantPoints: [
            'Unbalanced BSTs can degenerate into a linked list with O(n) search time; self-balancing trees (AVL, Red-Black) guarantee O(log n).',
            'In graph traversals, always maintain a visited set to avoid infinite cycles.'
        ],
        commonMistakes: [
            'Confusing tree height (edges from node to deepest leaf) with node depth (edges from root to node).',
            'Failing to track visited nodes in cyclic graphs, triggering infinite loops in BFS/DFS.'
        ],
        quickRevision: [
            'Tree: Connected acyclic graph with N nodes and N-1 edges.',
            'BST In-order traversal: produces sorted ascending sequence.',
            'BFS uses Queue (shortest path); DFS uses Stack / Recursion.'
        ],
        learningResources: [
            {
                title: 'Tree & Graph Traversal Visualizer',
                type: 'Guide',
                description: 'Step-by-step visualizations of BFS and DFS traversals.'
            }
        ]
    },
    'Dynamic programming': {
        topic: 'Dynamic programming',
        title: 'Dynamic Programming',
        difficulty: 'Advanced',
        estimatedMinutes: 45,
        weightage: 'Advanced Optimization (10%)',
        objectives: [
            'Identify the two prerequisites for DP: Optimal Substructure and Overlapping Subproblems',
            'Distinguish Top-Down DP with Memoization from Bottom-Up DP with Tabulation',
            'Construct state transitions and recurrence relations',
            'Optimize space complexity using state reduction techniques'
        ],
        detailedExplanation: `Dynamic Programming (DP) is an optimization technique that solves complex problems by breaking them into overlapping subproblems and caching their results. Unlike Divide-and-Conquer (where subproblems are independent), DP shines when identical subproblems are solved repeatedly.

The two fundamental properties required for Dynamic Programming are:
1. Optimal Substructure: An optimal solution to the overall problem contains within it optimal solutions to its subproblems.
2. Overlapping Subproblems: The recursive algorithm visits the same subproblems repeatedly rather than generating new ones.

Two primary implementation styles exist:
- Top-Down (Memoization): Retains recursive formulation and caches return values in a lookup table.
- Bottom-Up (Tabulation): Solves smallest subproblems first and iteratively fills a table without recursion overhead.`,
        coreConcepts: [
            {
                name: 'Memoization vs Tabulation',
                description: 'Memoization is recursive + cached (top-down); Tabulation is iterative + table-driven (bottom-up).'
            },
            {
                name: 'State Transition Equation',
                description: 'Mathematical formula expressing DP[i] in terms of preceding states (e.g. DP[i] = DP[i-1] + DP[i-2]).'
            },
            {
                name: 'Space Optimization',
                description: 'If state i only depends on state i-1 and i-2, space can be reduced from O(n) to O(1) using scalar variables.'
            }
        ],
        examples: [
            {
                title: 'Fibonacci: Top-Down Memoization vs Bottom-Up Tabulation',
                code: `// Top-Down (Memoization): O(n) time, O(n) space
function fibMemo(n, memo = {}) {
  if (n <= 1) return n;
  if (memo[n] !== undefined) return memo[n];
  return memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
}

// Bottom-Up with Space Optimization: O(n) time, O(1) space
function fibOptimal(n) {
  if (n <= 1) return n;
  let prev2 = 0, prev1 = 1;
  for (let i = 2; i <= n; i++) {
    const current = prev1 + prev2;
    prev2 = prev1;
    prev1 = current;
  }
  return prev1;
}`,
                explanation: 'Eliminates exponential O(2ⁿ) tree evaluation by caching subproblem solutions, dropping time complexity to O(n).'
            }
        ],
        importantPoints: [
            'Always clarify the base cases (e.g., dp[0] = 0, dp[1] = 1) before writing iterative loops.',
            'Identify what parameters uniquely define a state (1D, 2D, or bitmask).'
        ],
        commonMistakes: [
            'Attempting DP on problems lacking optimal substructure (e.g., longest simple path in general graphs).',
            'Forgetting to initialize DP table with base conditions or default identity values.'
        ],
        quickRevision: [
            'Two DP criteria: Optimal substructure + Overlapping subproblems.',
            'Top-down = Recursion + Memo table. Bottom-up = Iterative table filling.',
            'Check if full history is needed; often only previous 1 or 2 rows are required.'
        ],
        learningResources: [
            {
                title: 'Dynamic Programming Patterns',
                type: 'Guide',
                description: 'Classification of top DP patterns: Knapsack, LCS, LIS, and Grid paths.'
            }
        ]
    },
    'Time and space complexity': {
        topic: 'Time and space complexity',
        title: 'Time and Space Complexity',
        difficulty: 'Intermediate',
        estimatedMinutes: 30,
        weightage: 'Asymptotic Analysis (10%)',
        objectives: [
            'Master Big-O notation, Big-Ω (lower bound), and Big-Θ (tight bound)',
            'Analyze nested loops, divide-and-conquer recurrences, and recursion trees',
            'Differentiate between auxiliary space and total space complexity',
            'Rank common complexity classes: O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ) < O(n!)'
        ],
        detailedExplanation: `Asymptotic analysis evaluates algorithmic efficiency independent of machine hardware, compiler flags, or operating systems by measuring how resource requirements scale as input size n approaches infinity.

Big-O (O) represents an asymptotic upper bound—the worst-case performance guarantee. Big-Omega (Ω) describes the lower bound (best case), while Big-Theta (Θ) defines a tight bound where upper and lower bounds coincide.

Time complexity counts fundamental primitive operations (comparisons, arithmetic steps, memory writes) rather than wall-clock seconds. Space complexity accounts for total memory allocated during execution, separating input storage from auxiliary workspace.`,
        coreConcepts: [
            {
                name: 'The Asymptotic Hierarchy',
                description: 'Order of growth: O(1) constant < O(log n) logarithmic < O(n) linear < O(n log n) linearithmic < O(n²) quadratic < O(2ⁿ) exponential.'
            },
            {
                name: 'Dropping Constants & Non-Dominant Terms',
                description: 'In asymptotic analysis as n → ∞, O(3n² + 50n + 1000) simplifies strictly to O(n²).'
            },
            {
                name: 'Auxiliary vs Total Space',
                description: 'Auxiliary space measures extra memory allocated exclusively by the algorithm beyond the input.'
            }
        ],
        examples: [
            {
                title: 'Comparing Complexity Classes',
                code: `// O(1) Constant Time
function getFirst(arr) { return arr[0]; }

// O(log n) Logarithmic Time
function countHalvings(n) {
  let count = 0;
  while (n > 1) { n = Math.floor(n / 2); count++; }
  return count;
}

// O(n²) Quadratic Time (Nested dependent loops)
function printPairs(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      console.log(arr[i], arr[j]);
    }
  }
}`,
                explanation: 'Illustrates how loop nesting and step divisions produce distinctive growth rates.'
            }
        ],
        importantPoints: [
            'Always state whether your analysis applies to best, worst, or average cases.',
            'Recursion depth consumes stack space: a recursive tree with depth d requires O(d) auxiliary space.'
        ],
        commonMistakes: [
            'Assuming two sequential loops take O(n²); two sequential loops of length n take O(n + n) = O(n).',
            'Overlooking hidden complexity inside standard library functions (e.g., Array.prototype.shift() is O(n), not O(1)).'
        ],
        quickRevision: [
            'Big-O: Asymptotic upper bound as n → ∞.',
            'Drop constants and lower-order terms.',
            'Binary search = O(log n). Nested loops = O(n²). MergeSort = O(n log n).'
        ],
        learningResources: [
            {
                title: 'Big-O Cheat Sheet',
                type: 'Guide',
                description: 'Definitive reference of complexities for common data structures and algorithms.'
            }
        ]
    }
};
exports.TOPIC_QUIZ_QUESTIONS = {
    'Variables and data types': [
        {
            id: 'vdt-1',
            topic: 'Variables and data types',
            questionText: 'What is the primary difference between a primitive type and a reference type in memory allocation?',
            type: 'mcq',
            options: [
                'Primitives store their actual values directly on the stack; reference types store pointers to heap-allocated objects',
                'Primitives are allocated exclusively on the heap, whereas reference types reside on the stack',
                'Primitives can be mutated in-place, whereas reference types cannot',
                'Reference types are always faster to allocate than primitives'
            ],
            correctAnswer: 'Primitives store their actual values directly on the stack; reference types store pointers to heap-allocated objects',
            explanation: 'Primitive types (like int, boolean, float) store direct values in stack frames. Reference types store memory addresses pointing to dynamic structures located on the heap.',
            concept: 'Primitive vs Reference Memory Allocation'
        },
        {
            id: 'vdt-2',
            topic: 'Variables and data types',
            questionText: 'Consider: let x = 5; let y = x; y = 10; What is the value of x, and why?',
            type: 'mcq',
            options: [
                '5, because primitive numbers are passed and assigned by value, copying the value',
                '10, because y shares the same memory reference as x',
                'undefined, because x was reassigned',
                'NaN, because integers cannot be duplicated'
            ],
            correctAnswer: '5, because primitive numbers are passed and assigned by value, copying the value',
            explanation: 'In JavaScript and most languages, primitives are assigned by value. Changing y creates an independent value and has no effect on x.',
            concept: 'Value Copy vs Reference Copy'
        },
        {
            id: 'vdt-3',
            topic: 'Variables and data types',
            questionText: 'In modern JavaScript, what happens if you mutate a property of an object declared with const (e.g. const user = { name: "A" }; user.name = "B";)?',
            type: 'mcq',
            options: [
                'The property modification succeeds because const prevents variable reassignment, not property mutation',
                'A TypeError is thrown because const makes the entire object recursively immutable',
                'The object creates a hidden clone in memory',
                'The code fails to compile'
            ],
            correctAnswer: 'The property modification succeeds because const prevents variable reassignment, not property mutation',
            explanation: 'const creates an immutable binding (the reference pointer cannot be reassigned to a different object), but the underlying object fields on the heap remain mutable unless explicitly frozen with Object.freeze().',
            concept: 'const Immutability vs Mutability'
        },
        {
            id: 'vdt-4',
            topic: 'Variables and data types',
            questionText: 'Which operator guarantees strict equality comparison without performing implicit type coercion?',
            type: 'mcq',
            options: [
                '=== (Strict equality)',
                '== (Loose equality)',
                '= (Assignment)',
                '!= (Loose inequality)'
            ],
            correctAnswer: '=== (Strict equality)',
            explanation: 'The === operator checks both data type and value equality without invoking implicit type coercion algorithms.',
            concept: 'Type Coercion and Strict Equality'
        },
        {
            id: 'vdt-5',
            topic: 'Variables and data types',
            questionText: 'True or False: Floating point numbers formatted under IEEE 754 can always represent decimal fractions like 0.1 and 0.2 with exact mathematical precision.',
            type: 'true_false',
            options: ['True', 'False'],
            correctAnswer: 'False',
            explanation: 'Decimal fractions like 0.1 result in repeating binary fractions in base-2, leading to tiny rounding discrepancies such as 0.1 + 0.2 === 0.30000000000000004.',
            concept: 'IEEE 754 Floating-Point Precision'
        },
        {
            id: 'vdt-6',
            topic: 'Variables and data types',
            questionText: 'What is the scope of a variable declared with "let" or "const" inside a block { ... }?',
            type: 'mcq',
            options: [
                'Block scope (accessible only inside the enclosing curly braces)',
                'Function scope (accessible anywhere inside the enclosing function)',
                'Global scope (accessible across the entire application)',
                'Module scope only'
            ],
            correctAnswer: 'Block scope (accessible only inside the enclosing curly braces)',
            explanation: 'let and const are block-scoped, meaning their visibility is strictly confined within the nearest enclosing pair of curly brackets.',
            concept: 'Lexical Block Scope'
        }
    ],
    'Conditions and loops': [
        {
            id: 'cal-1',
            topic: 'Conditions and loops',
            questionText: 'How does logical short-circuit evaluation work with the && (AND) operator?',
            type: 'mcq',
            options: [
                'If the first operand evaluates to false, execution immediately stops and returns false without evaluating the second operand',
                'Both operands are always evaluated regardless of the first operand value',
                'It evaluates the right operand first before checking the left',
                'It throws a runtime exception if any operand is falsy'
            ],
            correctAnswer: 'If the first operand evaluates to false, execution immediately stops and returns false without evaluating the second operand',
            explanation: 'For A && B, if A is falsy, the conjunction cannot possibly be true, so B is never executed. This is crucial for null-safe guards like obj && obj.prop.',
            concept: 'Short-Circuit Evaluation'
        },
        {
            id: 'cal-2',
            topic: 'Conditions and loops',
            questionText: 'What is the key functional difference between "break" and "continue" statements inside a loop?',
            type: 'mcq',
            options: [
                '"break" terminates the loop entirely, while "continue" skips the rest of the current iteration and advances to the next',
                '"break" restarts the loop from the beginning, while "continue" stops the loop',
                '"continue" terminates outer loops, while "break" only works in switch statements',
                'There is no difference; they are interchangeable'
            ],
            correctAnswer: '"break" terminates the loop entirely, while "continue" skips the rest of the current iteration and advances to the next',
            explanation: 'break causes an immediate exit from the innermost enclosing loop. continue immediately jumps to the loop header/increment for the next cycle.',
            concept: 'Jump Statements (break vs continue)'
        },
        {
            id: 'cal-3',
            topic: 'Conditions and loops',
            questionText: 'What is an "off-by-one" error (OBOE) in array iteration?',
            type: 'mcq',
            options: [
                'An error where loop boundaries execute one time too many or one time too few (e.g. using <= length instead of < length)',
                'An error caused by incrementing the counter by 2 instead of 1',
                'An error where variables are shifted by one byte in memory',
                'An error caused by odd-numbered loop limits'
            ],
            correctAnswer: 'An error where loop boundaries execute one time too many or one time too few (e.g. using <= length instead of < length)',
            explanation: 'Since arrays are 0-indexed, the last valid index is length - 1. Iterating while i <= length accesses arr[length], which is undefined / out of bounds.',
            concept: 'Boundary Conditions and Off-By-One Errors'
        },
        {
            id: 'cal-4',
            topic: 'Conditions and loops',
            questionText: 'Which loop construct is guaranteed to execute its code block at least once before checking the condition?',
            type: 'mcq',
            options: [
                'do...while loop',
                'while loop',
                'for loop',
                'for...in loop'
            ],
            correctAnswer: 'do...while loop',
            explanation: 'A do...while loop tests its condition at the bottom, guaranteeing that the loop body executes at least once.',
            concept: 'Loop Execution Guarantees'
        },
        {
            id: 'cal-5',
            topic: 'Conditions and loops',
            questionText: 'True or False: An infinite loop occurs when the loop condition never evaluates to false because loop variables are not modified toward the termination criterion.',
            type: 'true_false',
            options: ['True', 'False'],
            correctAnswer: 'True',
            explanation: 'Without advancing the state variable toward the exit condition, the predicate remains perpetually true, resulting in an infinite loop.',
            concept: 'Loop Invariants and Termination'
        },
        {
            id: 'cal-6',
            topic: 'Conditions and loops',
            questionText: 'What will be output by: for (let i = 0; i < 3; i++) { if (i === 1) continue; console.log(i); }?',
            type: 'mcq',
            options: [
                '0 and 2',
                '0, 1, and 2',
                '0',
                '1 and 2'
            ],
            correctAnswer: '0 and 2',
            explanation: 'When i === 1, continue skips the console.log call, printing 0 then 2.',
            concept: 'Iteration Flow Control'
        }
    ],
    'Arrays and strings': [
        {
            id: 'aas-1',
            topic: 'Arrays and strings',
            questionText: 'Why does accessing an element by index in an array (e.g. arr[i]) take O(1) constant time?',
            type: 'mcq',
            options: [
                'Because elements reside in contiguous memory, allowing direct address arithmetic: BaseAddress + (i * elementSize)',
                'Because the CPU maintains a hash table of all array elements in cache',
                'Because arrays automatically binary search their indices',
                'Because array indices are stored in CPU registers'
            ],
            correctAnswer: 'Because elements reside in contiguous memory, allowing direct address arithmetic: BaseAddress + (i * elementSize)',
            explanation: 'Contiguous memory layout allows the CPU to calculate the exact physical memory address in a single arithmetic calculation.',
            concept: 'Contiguous Memory and Random Access'
        },
        {
            id: 'aas-2',
            topic: 'Arrays and strings',
            questionText: 'What is the time complexity of inserting an element at the beginning (index 0) of an array containing N elements?',
            type: 'mcq',
            options: [
                'O(N) time, because all N existing elements must be shifted one position to the right',
                'O(1) constant time',
                'O(log N) logarithmic time',
                'O(N²) quadratic time'
            ],
            correctAnswer: 'O(N) time, because all N existing elements must be shifted one position to the right',
            explanation: 'Inserting at the beginning requires moving every subsequent element to the next memory offset, which takes linear O(N) operations.',
            concept: 'Array Insertion Complexity'
        },
        {
            id: 'aas-3',
            topic: 'Arrays and strings',
            questionText: 'What does it mean that strings are "immutable" in languages like JavaScript, Python, and Java?',
            type: 'mcq',
            options: [
                'Once created, characters within the string cannot be modified in-place; any alteration produces a new string in memory',
                'Strings cannot be passed as parameters to functions',
                'Strings can only hold ASCII characters',
                'String lengths cannot exceed 256 characters'
            ],
            correctAnswer: 'Once created, characters within the string cannot be modified in-place; any alteration produces a new string in memory',
            explanation: 'String immutability means individual characters cannot be changed in place (str[0] = "x" will not alter str). All transformation methods return newly created strings.',
            concept: 'String Immutability'
        },
        {
            id: 'aas-4',
            topic: 'Arrays and strings',
            questionText: 'When reversing an array in-place using two pointers (left at start, right at end), what is the auxiliary space complexity?',
            type: 'mcq',
            options: [
                'O(1) auxiliary space (constant extra memory)',
                'O(N) auxiliary space',
                'O(log N) auxiliary space',
                'O(N²) auxiliary space'
            ],
            correctAnswer: 'O(1) auxiliary space (constant extra memory)',
            explanation: 'The two pointers swap values directly inside the existing array, requiring only a single temporary variable regardless of array length.',
            concept: 'Two-Pointer Technique'
        },
        {
            id: 'aas-5',
            topic: 'Arrays and strings',
            questionText: 'True or False: Appending an element to the end of a dynamic array (like JavaScript Array or Python list) has an amortized time complexity of O(1).',
            type: 'true_false',
            options: ['True', 'False'],
            correctAnswer: 'True',
            explanation: 'Although doubling the capacity occasionally takes O(N) reallocation, the resizing cost spread across N operations yields an amortized O(1) time per append.',
            concept: 'Dynamic Array Resizing'
        },
        {
            id: 'aas-6',
            topic: 'Arrays and strings',
            questionText: 'What algorithm pattern is ideal for finding the maximum sum of any contiguous subarray of fixed size K?',
            type: 'mcq',
            options: [
                'Sliding Window',
                'Binary Search',
                'Depth-First Search',
                'Greedy Knapsack'
            ],
            correctAnswer: 'Sliding Window',
            explanation: 'The sliding window maintains a running sum by adding the new incoming element and subtracting the outgoing element in O(1) per step, achieving total O(N) time.',
            concept: 'Sliding Window Pattern'
        }
    ],
    'Searching and sorting': [
        {
            id: 'sas-1',
            topic: 'Searching and sorting',
            questionText: 'What is the mandatory prerequisite condition for performing Binary Search on an array?',
            type: 'mcq',
            options: [
                'The array must be sorted in ascending or descending order',
                'The array must contain only positive integers',
                'The array length must be a power of two',
                'The array must not contain duplicate values'
            ],
            correctAnswer: 'The array must be sorted in ascending or descending order',
            explanation: 'Binary Search relies on monotonic ordering to eliminate half of the search interval at each step. On unsorted data, binary search produces incorrect results.',
            concept: 'Binary Search Prerequisites'
        },
        {
            id: 'sas-2',
            topic: 'Searching and sorting',
            questionText: 'What is the worst-case and average-case time complexity of Merge Sort on an array of size N?',
            type: 'mcq',
            options: [
                'O(N log N) in both average and worst cases',
                'O(N) average case and O(N²) worst case',
                'O(N²) in both average and worst cases',
                'O(log N) in both average and worst cases'
            ],
            correctAnswer: 'O(N log N) in both average and worst cases',
            explanation: 'Merge Sort consistently splits the array in halves (log N levels) and performs linear merging (O(N) per level), guaranteeing O(N log N) even in the worst case.',
            concept: 'Merge Sort Complexity'
        },
        {
            id: 'sas-3',
            topic: 'Searching and sorting',
            questionText: 'Why is QuickSort often preferred in practice over Merge Sort despite its worst-case O(N²) time complexity?',
            type: 'mcq',
            options: [
                'QuickSort sorts in-place with O(1) auxiliary space and exhibits superior CPU cache locality',
                'QuickSort is a stable sort whereas Merge Sort is not',
                'QuickSort has a mathematical worst-case bound of O(N)',
                'QuickSort does not perform any comparisons'
            ],
            correctAnswer: 'QuickSort sorts in-place with O(1) auxiliary space and exhibits superior CPU cache locality',
            explanation: 'QuickSort partitions elements in-place without allocating O(N) secondary arrays, and sequential memory access heavily benefits modern CPU L1/L2 hardware caches.',
            concept: 'QuickSort vs MergeSort Trade-offs'
        },
        {
            id: 'sas-4',
            topic: 'Searching and sorting',
            questionText: 'What does "algorithm stability" mean in the context of sorting?',
            type: 'mcq',
            options: [
                'Equal keys preserve their original relative order after sorting',
                'The algorithm runs without crashing on empty lists',
                'The algorithm uses O(1) auxiliary space',
                'The best case and worst case complexities are identical'
            ],
            correctAnswer: 'Equal keys preserve their original relative order after sorting',
            explanation: 'A sort is stable if two items with identical comparison keys remain in the exact same relative order as they appeared in the input collection.',
            concept: 'Sorting Stability'
        },
        {
            id: 'sas-5',
            topic: 'Searching and sorting',
            questionText: 'True or False: Any comparison-based sorting algorithm has a theoretical lower bound of Ω(N log N) in the worst case.',
            type: 'true_false',
            options: ['True', 'False'],
            correctAnswer: 'True',
            explanation: 'Because there are N! possible permutations of an array, a binary decision tree must have depth at least log₂(N!) = Ω(N log N).',
            concept: 'Comparison Sorting Lower Bound'
        },
        {
            id: 'sas-6',
            topic: 'Searching and sorting',
            questionText: 'In Binary Search, how should mid be calculated to avoid integer overflow in statically-typed languages?',
            type: 'mcq',
            options: [
                'mid = low + (high - low) / 2',
                'mid = (low + high) / 2',
                'mid = low * 2',
                'mid = high / 2'
            ],
            correctAnswer: 'mid = low + (high - low) / 2',
            explanation: 'If low and high are large, low + high can overflow a 32-bit signed integer. Using low + (high - low) / 2 prevents overflow.',
            concept: 'Integer Overflow Prevention'
        }
    ],
    'Recursion': [
        {
            id: 'rec-1',
            topic: 'Recursion',
            questionText: 'What is the primary role of the "base case" in a recursive function?',
            type: 'mcq',
            options: [
                'To provide a terminating condition that returns directly without making further recursive calls, preventing infinite recursion',
                'To allocate memory for the call stack',
                'To speed up arithmetic operations',
                'To initialize loop variables'
            ],
            correctAnswer: 'To provide a terminating condition that returns directly without making further recursive calls, preventing infinite recursion',
            explanation: 'Without a base case, recursive functions invoke themselves indefinitely until call stack space is exhausted, crashing with a StackOverflowError.',
            concept: 'Recursive Base Case'
        },
        {
            id: 'rec-2',
            topic: 'Recursion',
            questionText: 'What structure does the runtime environment use to manage active recursive function calls, parameters, and return addresses?',
            type: 'mcq',
            options: [
                'Call Stack (LIFO structure of activation records)',
                'FIFO Queue',
                'Priority Queue',
                'Hash Map'
            ],
            correctAnswer: 'Call Stack (LIFO structure of activation records)',
            explanation: 'Each function invocation pushes a new stack frame onto the Call Stack. When a call completes, its frame is popped to return to the caller.',
            concept: 'Call Stack and Activation Records'
        },
        {
            id: 'rec-3',
            topic: 'Recursion',
            questionText: 'What is "tail recursion"?',
            type: 'mcq',
            options: [
                'A recursive function where the recursive call is the very last operation performed before returning',
                'A recursion that calls two child functions at each step',
                'A recursive function without a base case',
                'Recursion that operates in reverse order on an array'
            ],
            correctAnswer: 'A recursive function where the recursive call is the very last operation performed before returning',
            explanation: 'In tail recursion, the function directly returns the result of the recursive call, allowing optimizing compilers to reuse the existing stack frame (Tail Call Optimization).',
            concept: 'Tail Recursion and TCO'
        },
        {
            id: 'rec-4',
            topic: 'Recursion',
            questionText: 'What is the space complexity of calculating factorial(N) using standard non-tail recursion?',
            type: 'mcq',
            options: [
                'O(N) space, due to N nested activation frames on the call stack',
                'O(1) constant space',
                'O(N²) space',
                'O(log N) space'
            ],
            correctAnswer: 'O(N) space, due to N nested activation frames on the call stack',
            explanation: 'Because factorial(N) = N * factorial(N-1) must wait for factorial(N-1) to resolve, N activation records stay simultaneously active on the call stack.',
            concept: 'Recursion Auxiliary Space'
        },
        {
            id: 'rec-5',
            topic: 'Recursion',
            questionText: 'True or False: Every recursive algorithm can mathematically be rewritten as an iterative algorithm using an explicit stack or loop.',
            type: 'true_false',
            options: ['True', 'False'],
            correctAnswer: 'True',
            explanation: 'By using an explicit stack data structure on the heap, any recursive algorithm can be converted into an equivalent iterative form.',
            concept: 'Equivalence of Recursion and Iteration'
        },
        {
            id: 'rec-6',
            topic: 'Recursion',
            questionText: 'Why does naive recursive calculation of the Nth Fibonacci number (fib(n) = fib(n-1) + fib(n-2)) run in exponential O(2ⁿ) time?',
            type: 'mcq',
            options: [
                'Because identical subproblems (like fib(3)) are recalculated redundantly an exponential number of times across the recursion tree',
                'Because addition is an exponential operation',
                'Because the call stack overflows',
                'Because integers double in size at each step'
            ],
            correctAnswer: 'Because identical subproblems (like fib(3)) are recalculated redundantly an exponential number of times across the recursion tree',
            explanation: 'The branching recursion tree recalculates the exact same sub-problems over and over, producing roughly 2ⁿ calls unless memoization is introduced.',
            concept: 'Overlapping Subproblems in Recursion'
        }
    ],
    'Linked lists, stacks, and queues': [
        {
            id: 'lsq-1',
            topic: 'Linked lists, stacks, and queues',
            questionText: 'What is the primary architectural difference between a Singly Linked List and a Doubly Linked List?',
            type: 'mcq',
            options: [
                'A doubly linked list node contains pointers to both the next node and the previous node, enabling bidirectional traversal',
                'A doubly linked list can store twice as many data values in each node',
                'A singly linked list uses twice as much memory per node',
                'A doubly linked list provides O(1) random index access'
            ],
            correctAnswer: 'A doubly linked list node contains pointers to both the next node and the previous node, enabling bidirectional traversal',
            explanation: 'Each node in a doubly linked list contains two pointers: next and prev. This allows O(1) deletion of a node if a pointer to it is already held.',
            concept: 'Singly vs Doubly Linked Lists'
        },
        {
            id: 'lsq-2',
            topic: 'Linked lists, stacks, and queues',
            questionText: 'What access discipline governs a Stack, and what are its core operations?',
            type: 'mcq',
            options: [
                'LIFO (Last-In, First-Out); push (add to top), pop (remove from top), and peek (inspect top)',
                'FIFO (First-In, First-Out); enqueue and dequeue',
                'Random access by numerical index',
                'Priority ordering by key'
            ],
            correctAnswer: 'LIFO (Last-In, First-Out); push (add to top), pop (remove from top), and peek (inspect top)',
            explanation: 'A Stack strictly enforces LIFO order. The most recently pushed element is the first one removed by pop(), all in O(1) time.',
            concept: 'Stack LIFO Discipline'
        },
        {
            id: 'lsq-3',
            topic: 'Linked lists, stacks, and queues',
            questionText: 'What access discipline governs a Queue, and where are elements inserted and removed?',
            type: 'mcq',
            options: [
                'FIFO (First-In, First-Out); elements are inserted at the rear (enqueue) and removed from the front (dequeue)',
                'LIFO; elements are inserted and removed at the front',
                'Elements are inserted and removed from the middle',
                'Elements are sorted automatically upon entry'
            ],
            correctAnswer: 'FIFO (First-In, First-Out); elements are inserted at the rear (enqueue) and removed from the front (dequeue)',
            explanation: 'A Queue functions like a ticket counter line (FIFO): new arrivals enter at the back (rear) and the earliest arrival departs from the front, both in O(1).',
            concept: 'Queue FIFO Discipline'
        },
        {
            id: 'lsq-4',
            topic: 'Linked lists, stacks, and queues',
            questionText: 'Why is using a standard array with shift() inefficient for implementing a Queue in JavaScript?',
            type: 'mcq',
            options: [
                'Array shift() removes the first element and shifts all remaining elements left, taking O(N) linear time per dequeue',
                'shift() is not supported on arrays',
                'Array shift() causes integer overflow',
                'Arrays cannot store objects'
            ],
            correctAnswer: 'Array shift() removes the first element and shifts all remaining elements left, taking O(N) linear time per dequeue',
            explanation: 'Removing index 0 from a contiguous array requires moving every subsequent item to the left, degrading dequeue performance to O(N).',
            concept: 'Queue Array vs Linked List Trade-offs'
        },
        {
            id: 'lsq-5',
            topic: 'Linked lists, stacks, and queues',
            questionText: 'True or False: Using a dummy/sentinel head node in a linked list eliminates special-case logic when inserting or deleting at the front of the list.',
            type: 'true_false',
            options: ['True', 'False'],
            correctAnswer: 'True',
            explanation: 'A dummy head node guarantees that every valid data node (including the first one) always has a preceding node, preventing edge-case head reassignments.',
            concept: 'Sentinel / Dummy Head Nodes'
        },
        {
            id: 'lsq-6',
            topic: 'Linked lists, stacks, and queues',
            questionText: 'Which data structure is most appropriate for implementing an "Undo" feature in a text editor?',
            type: 'mcq',
            options: [
                'Stack',
                'Queue',
                'Binary Search Tree',
                'Hash Set'
            ],
            correctAnswer: 'Stack',
            explanation: 'Undo requires reverting the most recent action first, which is the textbook application of a LIFO Stack.',
            concept: 'Stack Applications'
        }
    ],
    'Trees and graphs': [
        {
            id: 'tag-1',
            topic: 'Trees and graphs',
            questionText: 'What is the governing invariant of a valid Binary Search Tree (BST)?',
            type: 'mcq',
            options: [
                'For every node, all values in its left subtree must be less than the node value, and all values in its right subtree must be greater',
                'Every node must have exactly two children',
                'The tree depth must equal log₂(N)',
                'Leaves must all reside on the exact same depth level'
            ],
            correctAnswer: 'For every node, all values in its left subtree must be less than the node value, and all values in its right subtree must be greater',
            explanation: 'The BST invariant guarantees that left subtree keys < node key < right subtree keys across all subtrees, enabling O(h) search operations.',
            concept: 'Binary Search Tree Invariant'
        },
        {
            id: 'tag-2',
            topic: 'Trees and graphs',
            questionText: 'Which tree traversal order visits a Binary Search Tree (BST) and produces elements in strictly ascending sorted order?',
            type: 'mcq',
            options: [
                'In-order Traversal (Left, Root, Right)',
                'Pre-order Traversal (Root, Left, Right)',
                'Post-order Traversal (Left, Right, Root)',
                'Level-order Traversal (Breadth-First)'
            ],
            correctAnswer: 'In-order Traversal (Left, Root, Right)',
            explanation: 'In-order visits everything smaller (left), then the current node, then everything larger (right), naturally producing a sorted sequence.',
            concept: 'Tree Traversals'
        },
        {
            id: 'tag-3',
            topic: 'Trees and graphs',
            questionText: 'What fundamental auxiliary data structure is utilized by Breadth-First Search (BFS) to explore vertices level-by-level?',
            type: 'mcq',
            options: [
                'Queue (FIFO)',
                'Stack (LIFO)',
                'Priority Heap',
                'Bloom Filter'
            ],
            correctAnswer: 'Queue (FIFO)',
            explanation: 'BFS enqueues neighbors of the current vertex and dequeues them in chronological discovery order, ensuring all vertices at distance d are visited before distance d+1.',
            concept: 'Breadth-First Search (BFS)'
        },
        {
            id: 'tag-4',
            topic: 'Trees and graphs',
            questionText: 'Why must a "visited" set or array be maintained during graph traversals (BFS/DFS)?',
            type: 'mcq',
            options: [
                'To prevent infinite loops when the graph contains cycles',
                'To sort vertices in alphabetical order',
                'To count the total number of edges',
                'To reduce graph connectivity'
            ],
            correctAnswer: 'To prevent infinite loops when the graph contains cycles',
            explanation: 'Unlike trees (which are acyclic), graphs can contain cycles. Without tracking visited vertices, traversals will loop endlessly through cycles.',
            concept: 'Cycle Detection and Visited Sets'
        },
        {
            id: 'tag-5',
            topic: 'Trees and graphs',
            questionText: 'True or False: In an unweighted graph, Breadth-First Search (BFS) is guaranteed to find the shortest path (minimum number of edges) between two vertices.',
            type: 'true_false',
            options: ['True', 'False'],
            correctAnswer: 'True',
            explanation: 'Because BFS explores outward radially level-by-level, the first time target vertex T is dequeued represents the minimum edge distance from source S.',
            concept: 'BFS Shortest Path Guarantee'
        },
        {
            id: 'tag-6',
            topic: 'Trees and graphs',
            questionText: 'What is the space complexity of an Adjacency List representation for a graph with V vertices and E edges?',
            type: 'mcq',
            options: [
                'O(V + E)',
                'O(V²)',
                'O(E²)',
                'O(V * E)'
            ],
            correctAnswer: 'O(V + E)',
            explanation: 'An adjacency list allocates an array/list of size V, and the sum of all neighbor entries across all adjacency lists equals E (or 2E for undirected graphs), yielding O(V + E).',
            concept: 'Graph Representation Complexity'
        }
    ],
    'Dynamic programming': [
        {
            id: 'dp-1',
            topic: 'Dynamic programming',
            questionText: 'What are the two mandatory properties a problem must possess to be solvable via Dynamic Programming?',
            type: 'mcq',
            options: [
                'Optimal Substructure and Overlapping Subproblems',
                'Greedy Choice Property and Linearity',
                'Sorted Inputs and Divide-and-Conquer partitions',
                'Infinite Memory and Single-Variable States'
            ],
            correctAnswer: 'Optimal Substructure and Overlapping Subproblems',
            explanation: 'Optimal substructure means optimal solutions to subproblems compose the global optimal solution. Overlapping subproblems means identical subproblems recur repeatedly.',
            concept: 'Core Prerequisites for DP'
        },
        {
            id: 'dp-2',
            topic: 'Dynamic programming',
            questionText: 'What is the difference between Top-Down DP (Memoization) and Bottom-Up DP (Tabulation)?',
            type: 'mcq',
            options: [
                'Top-Down uses recursion and stores results in a memo cache; Bottom-Up iteratively fills a DP table starting from base cases',
                'Top-Down is iterative whereas Bottom-Up is recursive',
                'Top-Down always runs faster than Bottom-Up',
                'Bottom-Up cannot be space-optimized'
            ],
            correctAnswer: 'Top-Down uses recursion and stores results in a memo cache; Bottom-Up iteratively fills a DP table starting from base cases',
            explanation: 'Top-Down starts at the root goal and recursively breaks it down, caching answers. Bottom-Up starts at base cases and builds solutions upwards iteratively.',
            concept: 'Memoization vs Tabulation'
        },
        {
            id: 'dp-3',
            topic: 'Dynamic programming',
            questionText: 'In the classic 0/1 Knapsack problem, why does the state require two dimensions: dp[i][w] (item index and remaining capacity)?',
            type: 'mcq',
            options: [
                'Because each item can be chosen at most once, so remaining weight alone is insufficient to prevent reusing previous items',
                'Because Knapsack requires two arrays of values',
                'Because 2D arrays are faster than 1D arrays',
                'Because weights must be negative'
            ],
            correctAnswer: 'Because each item can be chosen at most once, so remaining weight alone is insufficient to prevent reusing previous items',
            explanation: 'Since each item is distinct and cannot be reused, the state must track which subset of items {1...i} have been considered alongside the current weight capacity w.',
            concept: 'DP State Formulation'
        },
        {
            id: 'dp-4',
            topic: 'Dynamic programming',
            questionText: 'When computing the Nth Fibonacci number using bottom-up DP, how can the auxiliary space be optimized from O(N) to O(1)?',
            type: 'mcq',
            options: [
                'By storing only the previous two computed values (prev1 and prev2) instead of an entire array of size N',
                'By using binary search',
                'By using tail recursion',
                'By using floating point variables'
            ],
            correctAnswer: 'By storing only the previous two computed values (prev1 and prev2) instead of an entire array of size N',
            explanation: 'Because fib(i) only depends on fib(i-1) and fib(i-2), all older values can be discarded, allowing state updates in two scalar variables.',
            concept: 'DP State Space Optimization'
        },
        {
            id: 'dp-5',
            topic: 'Dynamic programming',
            questionText: 'True or False: If subproblems do not overlap (each subproblem is completely unique), standard Divide and Conquer is preferred over Dynamic Programming.',
            type: 'true_false',
            options: ['True', 'False'],
            correctAnswer: 'True',
            explanation: 'If subproblems never overlap (like in Merge Sort), memoizing results provides zero reuse benefit and wastes memory overhead.',
            concept: 'DP vs Divide and Conquer'
        },
        {
            id: 'dp-6',
            topic: 'Dynamic programming',
            questionText: 'What is the time complexity of solving the Longest Common Subsequence (LCS) problem of two strings of length M and N using DP?',
            type: 'mcq',
            options: [
                'O(M * N)',
                'O(M + N)',
                'O(2^(M + N))',
                'O(log(M * N))'
            ],
            correctAnswer: 'O(M * N)',
            explanation: 'The 2D table has size (M+1) x (N+1), and each cell takes O(1) comparison and lookup operations, yielding total O(M * N) time.',
            concept: '2D DP Complexity'
        }
    ],
    'Time and space complexity': [
        {
            id: 'tsc-1',
            topic: 'Time and space complexity',
            questionText: 'What does Big-O notation (e.g. O(N)) specifically quantify in computer science?',
            type: 'mcq',
            options: [
                'The asymptotic upper bound of growth for execution operations or memory requirements as input size N tends toward infinity',
                'The exact number of milliseconds an algorithm runs on a modern computer',
                'The minimum memory in bytes required by an application',
                'The compile time of source code'
            ],
            correctAnswer: 'The asymptotic upper bound of growth for execution operations or memory requirements as input size N tends toward infinity',
            explanation: 'Big-O describes an asymptotic upper bound, measuring how resource demand scales mathematically independent of specific hardware or compilers.',
            concept: 'Big-O Asymptotic Upper Bound'
        },
        {
            id: 'tsc-2',
            topic: 'Time and space complexity',
            questionText: 'Which of the following correctly orders complexity classes from most efficient to least efficient for large N?',
            type: 'mcq',
            options: [
                'O(1) < O(log N) < O(N) < O(N log N) < O(N²) < O(2ⁿ)',
                'O(N) < O(1) < O(N²) < O(log N) < O(2ⁿ)',
                'O(1) < O(N) < O(log N) < O(N²) < O(N log N)',
                'O(log N) < O(1) < O(N) < O(N!) < O(N²)'
            ],
            correctAnswer: 'O(1) < O(log N) < O(N) < O(N log N) < O(N²) < O(2ⁿ)',
            explanation: 'Constant O(1) is fastest, followed by logarithmic, linear, linearithmic, quadratic, and exponential.',
            concept: 'Complexity Hierarchy'
        },
        {
            id: 'tsc-3',
            topic: 'Time and space complexity',
            questionText: 'What is the time complexity of an algorithm with two nested loops: for (let i = 0; i < N; i++) { for (let j = 0; j < N; j++) { ... } }?',
            type: 'mcq',
            options: [
                'O(N²) quadratic time',
                'O(2N) linear time',
                'O(N log N) linearithmic time',
                'O(N³)'
            ],
            correctAnswer: 'O(N²) quadratic time',
            explanation: 'The inner loop executes N times for each of the N iterations of the outer loop, executing N * N = N² total operations.',
            concept: 'Nested Loop Complexity'
        },
        {
            id: 'tsc-4',
            topic: 'Time and space complexity',
            questionText: 'What is the difference between "auxiliary space" and "total space complexity"?',
            type: 'mcq',
            options: [
                'Auxiliary space measures extra/temporary memory allocated by the algorithm exclusively, excluding the input data size',
                'Auxiliary space includes the input, while total space excludes it',
                'Auxiliary space only refers to disk storage',
                'There is no difference'
            ],
            correctAnswer: 'Auxiliary space measures extra/temporary memory allocated by the algorithm exclusively, excluding the input data size',
            explanation: 'Total space = Input space + Auxiliary space. When an in-place algorithm sorts an array of size N, its auxiliary space is O(1) even though total space is O(N).',
            concept: 'Auxiliary vs Total Space'
        },
        {
            id: 'tsc-5',
            topic: 'Time and space complexity',
            questionText: 'True or False: In asymptotic analysis, constant multipliers and lower-order terms are discarded (e.g. O(5N² + 100N + 50) simplifies strictly to O(N²)).',
            type: 'true_false',
            options: ['True', 'False'],
            correctAnswer: 'True',
            explanation: 'As N approaches infinity, the highest-order term N² dominates the function so completely that scalar coefficients and lower terms become negligible.',
            concept: 'Dropping Constants and Non-Dominant Terms'
        },
        {
            id: 'tsc-6',
            topic: 'Time and space complexity',
            questionText: 'If a problem of size N is halved at each step until reaching 1 (e.g., N → N/2 → N/4 → ... → 1), how many steps does this process take?',
            type: 'mcq',
            options: [
                'O(log₂ N) steps',
                'O(N) steps',
                'O(N / 2) steps',
                'O(N²) steps'
            ],
            correctAnswer: 'O(log₂ N) steps',
            explanation: 'Halving N repeatedly reaches 1 in log₂ N steps, which is the foundational signature of logarithmic O(log N) algorithms like Binary Search.',
            concept: 'Logarithmic Division Time'
        }
    ]
};
