import type { Topic, GameDef, Achievement } from "../types";

export const CATEGORIES = [
  "Basics",
  "Control Flow",
  "Data Structures",
  "Functions",
  "Modules",
  "File I/O",
  "Error Handling",
] as const;

/** Python sample code — template literals preserve real newlines. */
const CODE: Record<string, string> = {
  hello1: `print("Hello, World!")
# => Hello, World!`,
  hello2: `name = "Ada"
print("Hi", name, "!")`,
  hello3: `print("Python", "3", sep=".", end=" | Hub")`,
  var1: `age = 25
price = 19.99
name = "Python"
print(age, price, name)`,
  var2: `value = 42
value = "now a string"
print(value)`,
  var3: `x, y, z = 1, 2, 3
print(x + y + z)`,
  num1: `print(7 + 3 * 2)
print(10 / 4)
print(10 // 4)
print(10 % 3)
print(2 ** 8)`,
  num2: `print(17 // 5)
print(17 % 5)
print(divmod(17, 5))`,
  num3: `print(2 ** 10)  # 1024
print(pow(3, 3))  # 27`,
  str1: `s = "Python 3 Hub"
print(s[0])
print(s[0:6])
print(s[-3:])
print(s[::-1])`,
  str2: `s = "  Hello World  "
print(s.strip().upper())
print(s.lower().replace("world", "hub"))`,
  str3: `lang = "Python"
year = 3
print(f"{lang} {year} is great!")
print(f"{1000:,}")
print(f"{0.25:.2%}")`,
  bool1: `print(5 > 3)
print(5 == "5")
print(10 <= 9)`,
  bool2: `print(True and False)
print(True or False)
print(not True)`,
  bool3: `print(bool(0), bool(1))
print(bool(""), bool("x"))
print(bool([]), bool([1]))`,
  in1: `name = input("Your name: ")
print("Hello", name)`,
  in2: `age = int(input("Age: "))
print("Next year:", age + 1)`,
  in3: `radius = float(input("Radius: "))
print("Area:", 3.14159 * radius ** 2)`,
  com1: `# Fahrenheit to Celsius
f = 100
c = (f - 32) * 5 / 9
print(c)  # 37.77...`,
  com2: `def greet(name):
    """Say hello to a person."""
    return f"Hello {name}"

print(greet("Hub"))`,
  com3: `# print("hidden")
print("shown")`,
  cast1: `a = "12"
b = "3.5"
print(int(a) + float(b))`,
  cast2: `n = 42
print("The answer is " + str(n))`,
  cast3: `nums = [1, 2, 2, 3]
print(tuple(nums))
print(list("abc"))
print(set(nums))`,
  op1: `total = 10
total += 5
total *= 2
print(total)`,
  op2: `s = "Python 3"
print("P" in s)
print("z" not in s)
print(3 in [1, 2, 3])`,
  op3: `a = [1, 2]
b = a
c = [1, 2]
print(a is b)
print(a is c)
print(a == c)`,
  scope1: `x = 10

def f():
    x = 5  # local
    print(x)

f()
print(x)`,
  scope2: `count = 0

def bump():
    global count
    count += 1

bump()
bump()
print(count)`,
  scope3: `msg = "outer"

def show():
    print(msg)  # reads global

show()`,
  if1: `score = 85

if score >= 90:
    print("A")
elif score >= 80:
    print("B")
else:
    print("C")`,
  if2: `age = 20
status = "adult" if age >= 18 else "minor"
print(status)`,
  if3: `x = 15

if x > 0:
    if x % 2 == 0:
        print("positive even")
    else:
        print("positive odd")`,
  for1: `for i in range(5):
    print(i, end=" ")`,
  for2: `fruits = ["apple", "banana", "cherry"]
for f in fruits:
    print(f.title())`,
  for3: `langs = ["py", "js", "go"]
for idx, lang in enumerate(langs, start=1):
    print(idx, lang)`,
  while1: `n = 5
while n > 0:
    print(n)
    n -= 1
print("Blast off!")`,
  while2: `n = 1
while True:
    print(n)
    n += 1
    if n > 4:
        break`,
  while3: `n = 12345
while n > 0:
    print(n % 10, end=" ")
    n //= 10`,
  list1: `nums = [3, 1, 2]
nums.append(4)
print(nums)
print(sorted(nums))`,
  list2: `stack = [1, 2, 3]
stack.append(4)
print(stack.pop())
print(stack)`,
  list3: `squares = [x * x for x in range(6)]
print(squares)`,
  tuple1: `point = (3, 4)
print(point[0])
try:
    point[0] = 9
except TypeError as e:
    print("immutable!")`,
  tuple2: `rgb = (255, 128, 0)
r, g, b = rgb
print(r, g, b)
a, *rest = [1, 2, 3, 4]
print(a, rest)`,
  tuple3: `t = (1, 2, 2, 3)
print(t.count(2))
print(t.index(3))`,
  dict1: `person = {"name": "Ada", "age": 36}
person["city"] = "London"
print(person.get("name"))
print(person.get("zip", "n/a"))`,
  dict2: `scores = {"a": 90, "b": 80}
for k, v in scores.items():
    print(k, v)`,
  dict3: `squares = {x: x * x for x in range(5)}
print(squares)`,
  set1: `nums = [1, 2, 2, 3, 3, 3]
print(set(nums))`,
  set2: `a = {1, 2, 3}
b = {2, 3, 4}
print(a | b)
print(a & b)
print(a - b)`,
  set3: `s = {1, 2}
s.add(3)
s.discard(99)
print(s)
print(2 in s)`,
  def1: `def add(a, b):
    return a + b

print(add(2, 3))`,
  def2: `def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Ada"))
print(greet("Bob", "Hi"))`,
  def3: `def min_max(nums):
    return min(nums), max(nums)

lo, hi = min_max([5, 2, 9])
print(lo, hi)`,
  lam1: `double = lambda x: x * 2
print(double(5))`,
  lam2: `nums = [1, 2, 3, 4, 5]
print(list(map(lambda x: x ** 2, nums)))
print(list(filter(lambda x: x % 2 == 0, nums)))`,
  lam3: `people = [("Ada", 36), ("Alan", 41), ("Grace", 45)]
print(sorted(people, key=lambda p: p[1]))`,
  mod1: `import math
print(math.sqrt(144))
print(math.pi)
print(math.floor(3.7))`,
  mod2: `import random
print(random.randint(1, 6))
print(random.choice(["a", "b", "c"]))`,
  mod3: `from datetime import date
today = date.today()
print(today.year, today.month, today.day)`,
  file1: `with open("notes.txt", "w") as f:
    f.write("Hello file!")
print("written")`,
  file2: `with open("notes.txt") as f:
    print(f.read())`,
  file3: `with open("notes.txt") as f:
    for line in f:
        print(line.strip())`,
  exc1: `try:
    n = int(input("num: "))
except ValueError:
    print("not a number")`,
  exc2: `try:
    x = 10 / 0
except ZeroDivisionError:
    print("div by zero")
except Exception as e:
    print("other:", e)`,
  exc3: `def check(n):
    if n < 0:
        raise ValueError("negative!")
    return n

try:
    print(check(-1))
except ValueError as e:
    print(e)
finally:
    print("done")`,
};

export const TOPICS: Topic[] = [
  // ── Basics (10) ──────────────────────────────
  {
    id: "hello-world",
    title: "Hello, World!",
    category: "Basics",
    description: "Your first Python program. The print() function sends text to the console.",
    difficulty: 1,
    icon: "cyan",
    concepts: ["print()", "Strings", "Program entry"],
    examples: [
      { title: "Classic greeting", code: CODE.hello1 },
      { title: "Multiple values", code: CODE.hello2 },
      { title: "Separator & end", code: CODE.hello3 },
    ],
  },
  {
    id: "variables",
    title: "Variables & Types",
    category: "Basics",
    description: "Store data in named variables. Python infers the type automatically.",
    difficulty: 1,
    icon: "teal",
    concepts: ["Assignment", "int / float / str / bool", "Type inference"],
    examples: [
      { title: "Basic assignment", code: CODE.var1 },
      { title: "Dynamic re-assignment", code: CODE.var2 },
      { title: "Multiple assignment", code: CODE.var3 },
    ],
  },
  {
    id: "numbers",
    title: "Numbers & Math",
    category: "Basics",
    description: "Arithmetic operators, floor division, modulo and built-in math helpers.",
    difficulty: 1,
    icon: "warm-gold",
    concepts: ["+ - * /", "// floor", "% modulo", "** power"],
    examples: [
      { title: "Arithmetic", code: CODE.num1 },
      { title: "Floor vs float", code: CODE.num2 },
      { title: "Powers", code: CODE.num3 },
    ],
  },
  {
    id: "strings",
    title: "Strings",
    category: "Basics",
    description: "Text manipulation: slicing, methods, f-strings, and concatenation.",
    difficulty: 1,
    icon: "pink",
    concepts: ["Slicing", "str methods", "f-strings", "len()"],
    examples: [
      { title: "Slicing", code: CODE.str1 },
      { title: "Methods", code: CODE.str2 },
      { title: "f-strings", code: CODE.str3 },
    ],
  },
  {
    id: "booleans",
    title: "Booleans & Comparison",
    category: "Basics",
    description: "True and False values, comparison operators, and logical operators.",
    difficulty: 1,
    icon: "silver",
    concepts: ["True / False", "== != < >", "and / or / not", "bool()"],
    examples: [
      { title: "Comparisons", code: CODE.bool1 },
      { title: "Logic", code: CODE.bool2 },
      { title: "Truthiness", code: CODE.bool3 },
    ],
  },
  {
    id: "input",
    title: "User Input",
    category: "Basics",
    description: "Read keyboard input with input() and convert it to numbers.",
    difficulty: 2,
    icon: "cyan",
    concepts: ["input()", "int() / float()", "Conversions"],
    examples: [
      { title: "Read a name", code: CODE.in1 },
      { title: "Numeric input", code: CODE.in2 },
      { title: "Float conversion", code: CODE.in3 },
    ],
  },
  {
    id: "comments",
    title: "Comments",
    category: "Basics",
    description: "Document your code with # comments and multi-line docstrings.",
    difficulty: 1,
    icon: "green",
    concepts: ["# comment", "Docstrings", "Readability"],
    examples: [
      { title: "Inline comments", code: CODE.com1 },
      { title: "Docstring", code: CODE.com2 },
      { title: "Commenting out", code: CODE.com3 },
    ],
  },
  {
    id: "type-casting",
    title: "Type Casting",
    category: "Basics",
    description: "Convert between str, int, float with explicit cast functions.",
    difficulty: 2,
    icon: "teal",
    concepts: ["int()", "float()", "str()", "list() / tuple()"],
    examples: [
      { title: "To numbers", code: CODE.cast1 },
      { title: "To string", code: CODE.cast2 },
      { title: "To collections", code: CODE.cast3 },
    ],
  },
  {
    id: "operators",
    title: "Operators",
    category: "Basics",
    description: "Assignment, comparison, logical and identity operators.",
    difficulty: 2,
    icon: "warm-gold",
    concepts: ["Augmented ops", "in / is", "Operator precedence"],
    examples: [
      { title: "Augmented assignment", code: CODE.op1 },
      { title: "Membership", code: CODE.op2 },
      { title: "Identity", code: CODE.op3 },
    ],
  },
  {
    id: "variables-scope",
    title: "Variable Scope",
    category: "Basics",
    description: "Local vs global variables and the global keyword.",
    difficulty: 3,
    icon: "indigo",
    concepts: ["local", "global", "builtins"],
    examples: [
      { title: "Local shadowing", code: CODE.scope1 },
      { title: "global keyword", code: CODE.scope2 },
      { title: "Scope read", code: CODE.scope3 },
    ],
  },
  // ── Control Flow (3) ──────────────────────────
  {
    id: "if-else",
    title: "If / Elif / Else",
    category: "Control Flow",
    description: "Branch your program with conditional statements.",
    difficulty: 2,
    icon: "pink",
    concepts: ["if", "elif", "else", "Nesting"],
    examples: [
      { title: "Basic branch", code: CODE.if1 },
      { title: "Ternary", code: CODE.if2 },
      { title: "Nested checks", code: CODE.if3 },
    ],
  },
  {
    id: "loops",
    title: "For Loops",
    category: "Control Flow",
    description: "Iterate over sequences with for loops.",
    difficulty: 2,
    icon: "cyan",
    concepts: ["for ... in", "range()", "enumerate()", "break / continue"],
    examples: [
      { title: "Range loop", code: CODE.for1 },
      { title: "Iterate a list", code: CODE.for2 },
      { title: "enumerate", code: CODE.for3 },
    ],
  },
  {
    id: "while",
    title: "While Loops",
    category: "Control Flow",
    description: "Repeat while a condition stays true.",
    difficulty: 3,
    icon: "teal",
    concepts: ["while", "break / continue", "Infinite loop safety"],
    examples: [
      { title: "Countdown", code: CODE.while1 },
      { title: "break", code: CODE.while2 },
      { title: "Digits of a number", code: CODE.while3 },
    ],
  },
  // ── Data Structures (4) ───────────────────────
  {
    id: "lists",
    title: "Lists",
    category: "Data Structures",
    description: "Ordered, mutable collections with rich methods.",
    difficulty: 2,
    icon: "green",
    concepts: ["append / pop", "Indexing", "Sorting", "Slicing"],
    examples: [
      { title: "Build a list", code: CODE.list1 },
      { title: "Methods", code: CODE.list2 },
      { title: "Comprehension", code: CODE.list3 },
    ],
  },
  {
    id: "tuples",
    title: "Tuples",
    category: "Data Structures",
    description: "Immutable ordered sequences packed for safety and speed.",
    difficulty: 2,
    icon: "silver",
    concepts: ["Immutable", "Packing / unpacking", "count / index"],
    examples: [
      { title: "Basic tuple", code: CODE.tuple1 },
      { title: "Unpacking", code: CODE.tuple2 },
      { title: "Tuple methods", code: CODE.tuple3 },
    ],
  },
  {
    id: "dicts",
    title: "Dictionaries",
    category: "Data Structures",
    description: "Key-value pairs for fast lookups and structured data.",
    difficulty: 3,
    icon: "warm-gold",
    concepts: ["get / setdefault", "keys / values / items", "Dict comprehension"],
    examples: [
      { title: "Build a dict", code: CODE.dict1 },
      { title: "Iterate items", code: CODE.dict2 },
      { title: "Comprehension", code: CODE.dict3 },
    ],
  },
  {
    id: "sets",
    title: "Sets",
    category: "Data Structures",
    description: "Unordered collections of unique items with set algebra.",
    difficulty: 3,
    icon: "indigo",
    concepts: ["Uniqueness", "union / intersection", "add / discard"],
    examples: [
      { title: "Deduplicate", code: CODE.set1 },
      { title: "Set algebra", code: CODE.set2 },
      { title: "Methods", code: CODE.set3 },
    ],
  },
  // ── Functions (2) ─────────────────────────────
  {
    id: "def",
    title: "Defining Functions",
    category: "Functions",
    description: "Reusable blocks with parameters, returns, and defaults.",
    difficulty: 2,
    icon: "cyan",
    concepts: ["def", "return", "Default args", "Docstrings"],
    examples: [
      { title: "Simple function", code: CODE.def1 },
      { title: "Defaults & named args", code: CODE.def2 },
      { title: "Multiple returns", code: CODE.def3 },
    ],
  },
  {
    id: "lambda",
    title: "Lambda & Higher-Order",
    category: "Functions",
    description: "Anonymous one-liners and functions that take functions.",
    difficulty: 3,
    icon: "pink",
    concepts: ["lambda", "map / filter", "sorted with key"],
    examples: [
      { title: "Lambda basics", code: CODE.lam1 },
      { title: "map & filter", code: CODE.lam2 },
      { title: "Sort with key", code: CODE.lam3 },
    ],
  },
  // ── Modules (1) ───────────────────────────────
  {
    id: "modules",
    title: "Modules & Packages",
    category: "Modules",
    description: "Import standard library modules like math, random, datetime.",
    difficulty: 2,
    icon: "green",
    concepts: ["import", "from ... import", "math / random / datetime"],
    examples: [
      { title: "math module", code: CODE.mod1 },
      { title: "random module", code: CODE.mod2 },
      { title: "datetime module", code: CODE.mod3 },
    ],
  },
  // ── File I/O (1) ──────────────────────────────
  {
    id: "file-io",
    title: "File I/O",
    category: "File I/O",
    description: "Read and write files with context managers.",
    difficulty: 3,
    icon: "warm-gold",
    concepts: ["open()", "with", "read / write / append", "readlines"],
    examples: [
      { title: "Write a file", code: CODE.file1 },
      { title: "Read a file", code: CODE.file2 },
      { title: "Iterate lines", code: CODE.file3 },
    ],
  },
  // ── Error Handling (1) ────────────────────────
  {
    id: "exceptions",
    title: "Exceptions & try/except",
    category: "Error Handling",
    description: "Handle runtime errors gracefully with try/except/finally.",
    difficulty: 3,
    icon: "indigo",
    concepts: ["try / except", "finally", "raise", "Custom errors"],
    examples: [
      { title: "Catch an error", code: CODE.exc1 },
      { title: "Multiple excepts", code: CODE.exc2 },
      { title: "finally & raise", code: CODE.exc3 },
    ],
  },
];

export const GAMES: GameDef[] = [
  {
    id: "tetris",
    name: "Tetris",
    icon: "cyan",
    tagline: "Stack falling blocks",
    color: "#22d3ee",
    code: `# Tetris core snippet
GRID_W, GRID_H = 10, 20
SHAPES = [
    [[1, 1, 1, 1]],
    [[1, 1], [1, 1]],
    [[0, 1, 0], [1, 1, 1]],
]

def collide(board, piece, dx, dy):
    for y, row in enumerate(piece):
        for x, cell in enumerate(row):
            if cell:
                nx, ny = x + dx, y + dy
                if nx < 0 or nx >= GRID_W: return True
                if ny >= GRID_H: return True
                if ny >= 0 and board[ny][nx]: return True
    return False`,
  },
  {
    id: "snake",
    name: "Snake",
    icon: "green",
    tagline: "Eat, grow, survive",
    color: "#4ade80",
    code: `# Snake core loop
from random import randint

W, H = 20, 20
snake = [(W // 2, H // 2)]
dirs = {"up": (0, -1), "down": (0, 1),
        "left": (-1, 0), "right": (1, 0)}

def step(food, d):
    dx, dy = dirs[d]
    head = (snake[0][0] + dx, snake[0][1] + dy)
    if head in snake:
        return None, False
    snake.insert(0, head)
    if head == food:
        return randint(0, W - 1), randint(0, H - 1), True
    snake.pop()
    return food, False`,
  },
  {
    id: "pacman",
    name: "Pacman",
    icon: "warm-gold",
    tagline: "Chomp dots, dodge ghosts",
    color: "#fbbf24",
    code: `# Pacman ghost chase AI
def ghost_move(ghost, pac, maze):
    gx, gy = ghost
    px, py = pac
    best, best_dir = 1e9, (0, 0)
    for dx, dy in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
        nx, ny = gx + dx, gy + dy
        if maze[ny][nx] == "#":
            continue
        d = abs(nx - px) + abs(ny - py)
        if d < best:
            best, best_dir = d, (dx, dy)
    return (gx + best_dir[0], gy + best_dir[1])`,
  },
  {
    id: "hangman",
    name: "Hangman",
    icon: "pink",
    tagline: "Guess the word",
    color: "#f472b6",
    code: `# Hangman game state
import random

WORDS = ["python", "function", "loop", "dictionary"]
word = random.choice(WORDS)
guessed, wrong = set(), 0
MAX_WRONG = 6

def guess(letter):
    global wrong
    if letter in word:
        guessed.add(letter)
    else:
        wrong += 1
    display = "".join(c if c in guessed else "_" for c in word)
    won = display == word
    lost = wrong >= MAX_WRONG
    return display, won, lost`,
  },
  {
    id: "runner",
    name: "Snake Runner",
    icon: "teal",
    tagline: "Jump the code blocks",
    color: "#2dd4bf",
    code: `# Snake runner jump physics
GRAVITY, JUMP_V = 0.6, -12
y, vy = 0, 0
obstacles = []

def update():
    global y, vy
    vy += GRAVITY
    y += vy
    if y > 0:
        y, vy = 0, 0
    for o in obstacles:
        o["x"] -= 4
    return any(o["x"] < 30 and y >= 0 for o in obstacles)`,
  },
];

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-steps", name: "First Steps", desc: "Complete your first topic", icon: "cyan", check: (p) => p.completedTopics.length >= 1 },
  { id: "halfway", name: "Halfway There", desc: "Complete 10 topics", icon: "teal", check: (p) => p.completedTopics.length >= 10 },
  { id: "master", name: "Python Master", desc: "Complete all 22 topics", icon: "warm-gold", check: (p) => p.completedTopics.length >= 22 },
  { id: "code-runner", name: "Code Runner", desc: "Run 25 playground scripts", icon: "green", check: (p) => p.totalRuns >= 25 },
  { id: "gamer", name: "Gamer", desc: "Play 10 game sessions", icon: "pink", check: (p) => p.gamesPlayed >= 10 },
  { id: "on-fire", name: "On Fire", desc: "Reach a 7-day streak", icon: "indigo", check: (p) => p.streak >= 7 },
  { id: "tetris-ace", name: "Tetris Ace", desc: "Score 1,000 in Tetris", icon: "cyan", check: (p) => (p.highScores["tetris"] ?? 0) >= 1000 },
  { id: "streak-master", name: "Streak Master", desc: "Reach a 30-day streak", icon: "silver", check: (p) => p.streak >= 30 },
];

export const PRESETS: Record<string, string> = {
  "Hello World": `print("Hello, Python 3 Hub!")
name = input("Your name: ")
print(f"Nice to meet you, {name}!")`,
  FizzBuzz: `for i in range(1, 16):
    if i % 15 == 0:
        print("FizzBuzz")
    elif i % 3 == 0:
        print("Fizz")
    elif i % 5 == 0:
        print("Buzz")
    else:
        print(i)`,
  Fibonacci: `def fib(n):
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

print(fib(10))`,
  "List Comprehension": `numbers = list(range(1, 21))
evens = [n for n in numbers if n % 2 == 0]
squares = [n * n for n in evens]
print("evens:", evens)
print("squares:", squares)`,
  "File Reader": `lines = []
with open("data.txt", "w") as f:
    f.write("line 1")
    f.write("line 2")
    f.write("line 3")

with open("data.txt") as f:
    for idx, line in enumerate(f, 1):
        print(idx, line.strip())`,
};

export const CODE_COLORS = {
  keyword: "#ff7b72",
  string: "#a5d6ff",
  comment: "#8b949e",
  function: "#d2a8ff",
  number: "#79c0ff",
  plain: "#e6edf3",
};