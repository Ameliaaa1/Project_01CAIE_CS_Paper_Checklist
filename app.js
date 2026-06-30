const topicBank = [
  {
    name: "Algorithms and problem solving",
    keywords: ["algorithm", "pseudocode", "flowchart", "trace table", "dry run", "decomposition", "abstraction"],
    focus: "Trace pseudocode, explain logic, and break problems into clear sub-problems."
  },
  {
    name: "Programming constructs",
    keywords: ["sequence", "selection", "iteration", "loop", "while", "for", "if", "case", "procedure", "function"],
    focus: "Write precise code using loops, conditions, procedures, functions, and parameters."
  },
  {
    name: "Data types and structures",
    keywords: ["integer", "real", "boolean", "char", "string", "array", "record", "stack", "queue", "list"],
    focus: "Choose suitable types and structures, then justify why they fit a task."
  },
  {
    name: "Databases",
    keywords: ["database", "table", "record", "field", "field name", "primary key", "sql", "query", "sort", "validation", "form", "report"],
    focus: "Model data clearly, choose suitable fields and validation, use keys correctly, and read or write simple queries."
  },
  {
    name: "Boolean logic",
    keywords: ["logic gate", "truth table", "and gate", "or gate", "not gate", "nand", "nor", "xor", "boolean"],
    focus: "Convert between logic statements, circuits, and truth tables."
  },
  {
    name: "Binary and hexadecimal",
    keywords: ["binary", "denary", "hexadecimal", "two's complement", "overflow", "shift", "mantissa", "exponent"],
    focus: "Convert number systems and explain representation limits."
  },
  {
    name: "Data representation",
    keywords: ["ascii", "unicode", "bitmap", "pixel", "resolution", "sample rate", "sampling", "compression", "lossless", "lossy"],
    focus: "Explain how text, images, and sound are stored and compressed."
  },
  {
    name: "Computer architecture",
    keywords: ["cpu", "alu", "cu", "register", "cache", "bus", "fetch", "decode", "execute", "von neumann"],
    focus: "Describe processor components and the fetch-decode-execute cycle."
  },
  {
    name: "Memory and storage",
    keywords: ["ram", "rom", "secondary storage", "magnetic", "optical", "solid state", "cloud storage", "virtual memory"],
    focus: "Compare storage technologies using speed, capacity, durability, and cost."
  },
  {
    name: "Operating systems",
    keywords: ["operating system", "scheduler", "interrupt", "memory management", "file management", "utility", "driver"],
    focus: "Explain how system software manages hardware and user tasks."
  },
  {
    name: "Networks",
    keywords: ["network", "lan", "wan", "router", "switch", "mac address", "ip address", "packet", "protocol", "tcp", "http"],
    focus: "Explain network hardware, protocols, addressing, and packet switching."
  },
  {
    name: "Internet technologies",
    keywords: ["internet", "web", "dns", "url", "html", "css", "javascript", "client", "server", "cookie"],
    focus: "Describe how web requests, DNS, clients, servers, and pages work together."
  },
  {
    name: "Cyber security",
    keywords: ["malware", "phishing", "firewall", "encryption", "authentication", "password", "2fa", "access rights", "hacking"],
    focus: "Identify threats and match them to suitable prevention methods."
  },
  {
    name: "Ethics and legislation",
    keywords: ["ethic", "privacy", "copyright", "data protection", "computer misuse", "surveillance", "environment"],
    focus: "Discuss social, legal, environmental, and ethical impacts with balanced points."
  },
  {
    name: "Systems life cycle",
    keywords: ["analysis", "design", "development", "testing", "implementation", "maintenance", "evaluation", "feasibility"],
    focus: "Apply the project stages and choose suitable test data."
  },
  {
    name: "Testing",
    keywords: ["test data", "normal data", "abnormal data", "extreme data", "validation", "verification", "syntax error", "logic error"],
    focus: "Design test plans and explain validation, verification, and error types."
  },
  {
    name: "File handling",
    keywords: ["file", "openfile", "readfile", "writefile", "append", "csv", "sequential", "random access"],
    focus: "Use file operations and explain how persistent data is read and written."
  },
  {
    name: "Hardware input and output",
    keywords: ["sensor", "actuator", "input device", "output device", "barcode", "qr", "printer", "screen", "microphone"],
    focus: "Select input/output devices for scenarios and justify the choice."
  },
  {
    name: "AI and expert systems",
    keywords: ["artificial intelligence", "machine learning", "training data", "prediction", "expert system", "inference engine", "knowledge base", "rules"],
    focus: "Explain rule-based decisions, training data, knowledge bases, and AI use cases."
  }
];

const sourceLibrary = [
  {
    name: "PapaCambridge 0478 directory",
    url: "https://pastpapers.papacambridge.com/papers/caie/igcse-computer-science-0478",
    text: "2019 March May June October November 2020 March May June October November 2021 March May June October November 2022 March May June October November 2023 March May June October November 2024 March May June October November 2025 March May June October November question paper mark scheme examiner report grade threshold"
  },
  {
    name: "2019-2022 Paper 1 theory pattern",
    paper: "paper1",
    era: "legacy",
    text: "cpu alu control unit register cache bus fetch decode execute memory ram rom storage magnetic optical solid state network lan wan router switch mac address ip address packet protocol internet dns url html css cyber security malware phishing firewall encryption authentication password access rights data representation binary hexadecimal ascii unicode bitmap resolution sampling compression lossless lossy input device output device sensor barcode ethics privacy copyright data protection computer misuse"
  },
  {
    name: "2019-2022 Paper 2 problem-solving pattern",
    paper: "paper2",
    era: "legacy",
    text: "algorithm pseudocode flowchart trace table dry run decomposition abstraction sequence selection iteration loop while for if procedure function parameter array string integer real boolean validation verification test data normal data abnormal data extreme data syntax error logic error file openfile readfile writefile append csv database table record field primary key sql pre release program design testing"
  },
  {
    name: "2023-2025 Paper 1 theory pattern",
    paper: "paper1",
    era: "revised",
    text: "binary denary hexadecimal overflow shift two's complement ascii unicode sound sample rate sampling image pixel resolution compression lossless lossy cpu fetch decode execute cache register memory storage cloud storage network router switch packet protocol tcp http dns cyber security malware phishing firewall encryption authentication 2fa ethics privacy copyright data protection environmental impact artificial intelligence expert system inference engine knowledge base"
  },
  {
    name: "2023-2025 Paper 2 algorithms and programming pattern",
    paper: "paper2",
    era: "revised",
    text: "pseudocode algorithm trace table array list record stack queue procedure function parameter return value selection iteration nested loop count total validation verification test data normal abnormal extreme file handling openfile readfile writefile sequential database sql query primary key foreign key boolean logic truth table and gate or gate not gate xor scenario answer programming constructs"
  },
  {
    name: "Mark-scheme answer style signals",
    paper: "both",
    era: "all",
    text: "state identify describe explain compare justify reason suitable example scenario precise terminology advantage disadvantage method mark answer candidate response validation verification trace table final output dry run algorithm efficiency maintainability test plan"
  },
  {
    name: "IGCSE 0478 Chapter 1 Data Representation guide",
    paper: "paper1",
    era: "revised",
    text: "data representation binary denary hexadecimal conversion number systems binary addition overflow logical shift two's complement ascii unicode character set sound sampling sample rate sample resolution sample depth channels image pixel resolution colour depth file size bit nibble byte kib mib gib image file size sound file size compression lossy lossless run length encoding rle mark scheme common mistakes scenario practice"
  },
  {
    name: "IGCSE 0478 Chapter 9 Databases guide",
    paper: "paper2",
    era: "revised",
    text: "database table record field field name data type primary key unique identifier meaningful field names validation range check type check length check presence check format check lookup check search query sort ascending descending select from where order by asc desc form data entry report formatted output common mistakes record field validation true primary key unique"
  },
  {
    name: "IGCSE 0478 cross-chapter checklist expansion",
    paper: "both",
    era: "revised",
    text: "embedded system opcode operand accumulator adc dac monitoring control system actuator utility software buffer assembler firmware interrupt service routine internet world wide web ssl tls pharming social engineering proxy server botnet ddos biometric authentication malware virus worm trojan spyware adware ransomware brute force data interception bubble sort machine learning training data pattern prediction input output assignment linear search count controlled pre condition post condition loop local global variables arithmetic comparison boolean operators string handling substring upper lower constants maintainability comments sum count truth table logic expression circuit scenario"
  }
];

const syllabusChecklist = {
  paper1: [
    {
      chapter: "1",
      title: "Data representation",
      sections: [
        {
          code: "1.1",
          title: "Number systems",
          items: [
            "Binary representation: computers process and store all data as 0s and 1s because logic circuits and registers use two stable states.",
            "Number systems: denary is base 10, binary is base 2, and hexadecimal is base 16 using digits 0-9 and A-F.",
            "Conversions: binary, denary and hexadecimal questions usually require clear place-value working; one hexadecimal digit represents four binary bits.",
            "Conversion limits: syllabus conversion questions can use positive binary values up to 16 bits, while binary addition, shifts and two's complement use 8-bit values.",
            "Hexadecimal uses: it is a shorter human-readable form of binary, commonly used for colour codes, MAC addresses, IPv6 addresses and error codes.",
            "Binary addition and overflow: an overflow occurs when the result is too large for the available number of bits, such as above 255 in unsigned 8-bit.",
            "Logical shifts: left shifts multiply positive binary integers by powers of two; right shifts divide and discard bits shifted out.",
            "Two's complement: 8-bit two's complement represents -128 to +127; the most significant bit has negative value when converting to denary."
          ]
        },
        {
          code: "1.2",
          title: "Text, sound and images",
          items: [
            "Character sets: each character is stored as a binary code; ASCII has fewer characters while Unicode supports more languages, symbols and emoji.",
            "Sound sampling: amplitude is measured at regular intervals and stored as binary values; higher sample rate improves accuracy and increases file size.",
            "Sample resolution: more bits per sample allow more accurate amplitude values but create larger files.",
            "Image representation: images are stored as pixels; resolution is the number of pixels and colour depth is the number of bits per pixel.",
            "Image quality and size: increasing resolution or colour depth increases both quality/detail and the number of bits needed."
          ]
        },
        {
          code: "1.3",
          title: "Data storage and compression",
          items: [
            "Storage units: 1 nibble is 4 bits, 1 byte is 8 bits, and binary units use 1024 between KiB, MiB, GiB, TiB, PiB and EiB.",
            "Image file size: image bits = width x height x colour depth; convert bits to bytes by dividing by 8.",
            "Sound file size: sound bits = sample rate x sample resolution x duration x channels.",
            "Compression purpose: smaller files need less storage, less bandwidth and shorter transmission/upload/download time.",
            "Lossy compression: permanently removes data, often reducing resolution, colour depth, sample rate or sample resolution.",
            "Lossless compression: reduces file size without permanent data loss; RLE stores repeated adjacent values as value plus count."
          ]
        }
      ]
    },
    {
      chapter: "2",
      title: "Data transmission",
      sections: [
        {
          code: "2.1",
          title: "Types and methods of data transmission",
          items: [
            "Packets: transmitted data is split into packets containing a header, payload and trailer.",
            "Packet header: usually stores destination address, packet number and originator address so packets can be routed and reordered.",
            "Packet switching: packets may take different routes through routers and are reassembled when all packets arrive.",
            "Packet switching benefits: it can share network paths efficiently and resend only missing or corrupted packets.",
            "Packet switching drawbacks: packets may be delayed, lost, arrive out of order or need reassembly at the destination.",
            "Transmission methods: serial sends one bit at a time, parallel sends multiple bits at once, and simplex/half-duplex/full-duplex describe direction of communication.",
            "Transmission suitability: serial is reliable over longer distances with fewer timing issues, while parallel can be faster over short distances but is more prone to skew/interference.",
            "Direction suitability: simplex is one-way only, half-duplex is both directions but not at the same time, and full-duplex allows simultaneous two-way communication.",
            "USB: a common interface for connecting devices and transmitting data, with benefits such as standardisation and drawbacks such as cable length or speed limits."
          ]
        },
        {
          code: "2.2",
          title: "Methods of error detection",
          items: [
            "Transmission errors: interference can cause data loss, data gain or data change during transmission.",
            "Parity checks: odd/even parity adds a parity bit; parity blocks can create a parity byte for larger checks.",
            "Parity limitation: parity can detect many single-bit errors but may fail when an even number of bits changes.",
            "Checksum: a calculated value is sent with data and recalculated by the receiver to detect differences.",
            "Echo check: data is sent back to the sender so the sender can compare it with the original.",
            "Check digit: an extra digit is calculated from the original data to detect entry errors in ISBNs and barcodes.",
            "ARQ: positive/negative acknowledgements and timeout are used to request retransmission when data is not received correctly."
          ]
        },
        {
          code: "2.3",
          title: "Encryption",
          items: [
            "Encryption purpose: data is scrambled so intercepted data cannot be understood without a decryption key.",
            "Encryption terms: plaintext is readable data, ciphertext is encrypted data, and a key is used to encrypt or decrypt.",
            "Symmetric encryption: the same key is used to encrypt and decrypt, so key sharing must be secure.",
            "Asymmetric encryption: public and private keys are paired; one key encrypts and the other decrypts."
          ]
        }
      ]
    },
    {
      chapter: "3",
      title: "Hardware",
      sections: [
        {
          code: "3.1",
          title: "Computer architecture",
          items: [
            "CPU role: the CPU processes instructions and data, producing outputs from inputs.",
            "Microprocessor: an integrated circuit on a single chip that can be used as a CPU in many devices.",
            "Von Neumann components: the ALU performs calculations/logic, the CU controls operations, registers hold data/instructions, and buses transfer data, addresses and control signals.",
            "FDE cycle: instructions are fetched from RAM, decoded by the control unit and executed using CPU components.",
            "CPU performance: more cores, larger cache and higher clock speed can improve performance, depending on the task.",
            "Instruction set: the list of machine-code commands a CPU can process.",
            "Machine-code instructions: an opcode identifies the operation and an operand identifies the data or address used by that operation.",
            "Registers in the FDE cycle: the PC, MAR, MDR, CIR and accumulator have different roles when instructions are fetched, decoded and executed.",
            "Embedded systems: dedicated systems built into devices such as appliances, cars, security systems and vending machines."
          ]
        },
        {
          code: "3.2",
          title: "Input and output devices",
          items: [
            "Input devices: devices such as keyboards, cameras, scanners, microphones and touch screens capture data for processing.",
            "Output devices: screens, printers, projectors, speakers, actuators and 3D printers present or act on processed data.",
            "Touch screens: resistive touch screens use pressure on two layers, while capacitive touch screens use the electrical properties of a finger and can support multi-touch.",
            "Printer technologies: inkjet printers spray droplets of ink through a print head, while laser printers use a charged drum, toner and heat/fusing to produce output.",
            "Specialised scanners: OCR reads printed text, OMR detects shaded marks, MICR reads magnetic-ink characters, and barcode/QR scanners read encoded patterns.",
            "Sensors: sensors measure physical data such as temperature, light, pressure, humidity, proximity, motion or pH.",
            "Named sensors: syllabus examples include acoustic, accelerometer, flow, gas, humidity, infra-red, level, light, magnetic field, moisture, pH, pressure, proximity and temperature sensors.",
            "Analogue and digital data: analogue sensor readings may need an ADC before processing, while a DAC may be used when digital output controls an analogue device.",
            "Monitoring vs control: monitoring systems measure and report data, while control systems also use actuators to change the environment.",
            "Control-system loop: sensor data is read, compared with stored values, a decision is made, and an actuator such as a motor, heater, light or valve is switched on or off.",
            "Scenario choice: answers should match the device to the data captured or output required, then justify using accuracy, speed, safety, cost or environment."
          ]
        },
        {
          code: "3.3",
          title: "Data storage",
          items: [
            "Primary storage: directly accessed by the CPU; RAM is volatile working memory and ROM stores permanent startup instructions.",
            "Secondary storage: not directly accessed by the CPU and used for long-term storage.",
            "Magnetic storage: HDDs use platters, tracks, sectors and electromagnets to read/write data.",
            "Optical storage: CDs, DVDs and Blu-ray use lasers to read pits and lands.",
            "Solid-state storage: SSDs, SD cards and USB drives use NAND/NOR flash memory with no moving parts.",
            "Flash memory operation: solid-state storage uses control gates and floating gates in NAND/NOR technology to store data electronically.",
            "HDD vs SSD choices: SSDs are faster, more durable and silent; HDDs are often cheaper per GB and suitable for large low-cost storage.",
            "Virtual memory: pages of data are moved between RAM and secondary storage when RAM is insufficient.",
            "Cloud storage: data is stored on remote servers and compared with local storage using access, cost, security, control and internet dependency."
          ]
        },
        {
          code: "3.4",
          title: "Network hardware",
          items: [
            "NIC: a network interface card allows a device to connect to a network and has a MAC address.",
            "MAC address: a usually hexadecimal hardware address made from manufacturer and serial codes.",
            "IP address: a network address assigned to a device; it can be static or dynamic.",
            "IPv4 and IPv6: IPv6 provides a much larger address space than IPv4.",
            "Router: sends data to a destination, assigns IP addresses and can connect a local network to the internet."
          ]
        }
      ]
    },
    {
      chapter: "4",
      title: "Software",
      sections: [
        {
          code: "4.1",
          title: "Types of software and interrupts",
          items: [
            "System software: provides services required by the computer, including operating systems and utility software.",
            "Application software: provides services required by the user, such as editing, browsing or design tasks.",
            "Utility software: performs maintenance or security tasks such as compression, backup, defragmentation, encryption and anti-malware scanning.",
            "Operating system functions: manages files, interrupts, interface, peripherals, drivers, memory, multitasking, security and user accounts.",
            "Firmware and OS: firmware starts and controls hardware at a low level, while the OS provides the platform for applications.",
            "Interrupts: signals that stop the current process so the CPU can deal with a higher-priority event before returning.",
            "Interrupt handling: the OS checks priority, stores the current process state, runs the interrupt service routine, then restores the previous process.",
            "Buffers: temporary storage areas used when data moves between devices or processes that work at different speeds."
          ]
        },
        {
          code: "4.2",
          title: "Programming languages, translators and IDEs",
          items: [
            "High-level languages: easier for humans to read and write, usually portable across systems.",
            "Low-level languages: closer to hardware; assembly uses mnemonics and machine code is binary instructions.",
            "Assembler: translates assembly language into machine code for a specific processor.",
            "Compiler: translates the whole program before execution and creates executable code.",
            "Interpreter: translates and runs code line by line, often useful for debugging.",
            "Compiler vs interpreter errors: a compiler reports errors for the whole program after compilation, while an interpreter stops when it reaches an error.",
            "Translator suitability: interpreters are useful during development and debugging, while compilers are often used for final executable programs.",
            "IDE features: code editor, error diagnostics, run-time environment, translator, auto-completion and debugging tools support program writing."
          ]
        }
      ]
    },
    {
      chapter: "5",
      title: "The internet and its uses",
      sections: [
        {
          code: "5.1",
          title: "The internet and the world wide web",
          items: [
            "Internet vs WWW: the internet is the global network infrastructure; the World Wide Web is a service using websites and web pages.",
            "URL: a uniform resource locator identifies the address of a web resource.",
            "HTTP and HTTPS: protocols used for web page transfer; HTTPS uses SSL/TLS-style encryption to protect communication.",
            "HTML and browsers: HTML structures web pages and browsers request, interpret and display them.",
            "Web authoring and CSS: HTML is used to create the structure/content of web pages, while CSS controls presentation such as colour, layout, fonts and reusable styling.",
            "Web page retrieval: the browser uses the URL, DNS resolves the domain to an IP address, a request is sent to the web server, and returned files are rendered.",
            "Browser functions: browsers provide navigation tools, an address bar, tabs, bookmarks/favourites, history, cookie storage and page rendering.",
            "Web servers: store and serve web pages when requested by clients.",
            "Cookies: small files stored by a browser to remember state, preferences, sessions or tracking information.",
            "Session vs persistent cookies: session cookies are temporary, while persistent cookies remain after the browser is closed until they expire or are deleted."
          ]
        },
        {
          code: "5.2",
          title: "Digital currency",
          items: [
            "Digital currency: money represented electronically rather than as physical cash.",
            "Cryptocurrency: a type of digital currency that commonly uses cryptographic methods and a blockchain rather than a central bank.",
            "Blockchain: a distributed ledger of linked blocks that records transactions and helps prevent tampering.",
            "Transaction validation: new transactions are checked and added to the chain so all participants share the same record."
          ]
        },
        {
          code: "5.3",
          title: "Cyber security",
          items: [
            "Threats: malware, phishing, pharming, brute-force attacks, denial of service and social engineering target systems or users.",
            "Malware types: syllabus examples include viruses, worms, Trojan horses, spyware, adware and ransomware.",
            "Brute-force, hacking and data interception: attackers may try many password combinations, gain unauthorised access, or capture data as it is transmitted.",
            "DDoS and botnets: many infected devices can send requests at once so a server becomes overloaded and legitimate users cannot access it.",
            "Phishing vs pharming: phishing tricks users into giving data, while pharming redirects users to a fake site even if they enter a legitimate address.",
            "Social engineering: attackers manipulate people, for example by impersonation, urgency or trust, rather than only attacking software.",
            "Malware protection: anti-malware, updates and safe downloading reduce infection risk.",
            "Anti-virus and anti-spyware: anti-virus detects, quarantines or removes viruses/malware; anti-spyware detects software that secretly monitors or collects user data.",
            "Access control: strong passwords, two-factor authentication, biometric checks and permissions reduce unauthorised access.",
            "Network protection: firewalls, encryption, secure protocols and proxy servers reduce interception and unauthorised traffic.",
            "Other safety controls: access levels, privacy settings and automated software updates help reduce exposure to security threats.",
            "Email and URL checks: suspicious senders, spelling changes, unexpected attachments, shortened links and mismatched domains can signal a scam.",
            "Scenario answers: match the threat to a specific control and explain why that control reduces the risk."
          ]
        }
      ]
    },
    {
      chapter: "6",
      title: "Automated and emerging technologies",
      sections: [
        {
          code: "6.1",
          title: "Automated systems",
          items: [
            "Automated system cycle: sensors collect data, a microprocessor compares readings with stored values, and actuators carry out actions.",
            "Advantages: automated systems can be faster, consistent, safer in dangerous environments and operate continuously.",
            "Disadvantages: systems can be expensive, fail if sensors are faulty, reduce jobs and require maintenance."
          ]
        },
        {
          code: "6.2",
          title: "Robotics",
          items: [
            "Robotics: the design, construction and use of robots to perform tasks automatically or semi-automatically.",
            "Robot characteristics: robots often use sensors, processors, actuators and programmed instructions.",
            "Robot roles: useful for repetitive, dangerous, precise or remote tasks such as manufacturing, surgery, exploration and warehouses."
          ]
        },
        {
          code: "6.3",
          title: "Artificial intelligence",
          items: [
            "AI: systems that perform tasks normally associated with human intelligence, such as learning, reasoning or decision-making.",
            "AI characteristics: can use data, rules or models to make predictions, classify inputs or adapt decisions.",
            "Expert systems: use a knowledge base, rule base, inference engine and user interface to give advice or conclusions.",
            "Expert-system process: user answers questions, the inference engine applies rules to the knowledge base, and the system outputs a recommendation.",
            "Machine learning: a system is trained using data so it can identify patterns, improve predictions or classify new inputs without being explicitly programmed for every case.",
            "Expert systems vs machine learning: expert systems rely on human-written rules, while machine-learning systems infer patterns from data."
          ]
        }
      ]
    }
  ],
  paper2: [
    {
      chapter: "7",
      title: "Algorithm design and problem-solving",
      sections: [
        {
          code: "7.1",
          title: "Program development and decomposition",
          items: [
            "Program development life cycle: analysis, design, coding, testing and maintenance/evaluation guide the creation of a solution.",
            "Decomposition: a large problem is broken into smaller sub-problems or sub-systems so each part can be designed and tested.",
            "Structure diagrams: show the hierarchy of a system or solution and the relationships between its components.",
            "Legacy pre-release tasks: older Paper 2 exams used pre-release material for practical programming preparation; candidates still needed to understand the scenario, data requirements, validation, processing and output before writing or explaining a solution.",
            "Algorithm purpose: an algorithm is a finite, ordered set of steps that solves a problem or completes a task.",
            "Abstraction: unnecessary detail is removed so the key data and processes are easier to model.",
            "Input, process and output: strong algorithm answers identify the data entered, the processing performed and the values displayed or stored.",
            "Assignment: values are stored in variables using assignment, and the value on the right is evaluated before it is placed in the variable."
          ]
        },
        {
          code: "7.2",
          title: "Standard methods, validation and testing",
          items: [
            "Standard methods: common algorithm patterns include total, count, maximum, minimum, average and linear search.",
            "Linear search: each item is checked in sequence until a match is found or the end of the list is reached.",
            "Bubble sort: adjacent values are compared and swapped repeatedly until the list is in the required order.",
            "Counting matches: initialise a counter to zero, test each item against a condition, then increment the counter for each match.",
            "Validation: checks whether input is reasonable or allowed, such as range, length, type, presence, format and check digit.",
            "Verification: checks whether data has been copied accurately, such as double entry or visual checking.",
            "Test data: normal data should be accepted, abnormal data should be rejected, boundary/extreme data tests limits."
          ]
        },
        {
          code: "7.3",
          title: "Trace tables, errors and algorithm writing",
          items: [
            "Trace tables: record variable values step by step during a dry run to find outputs or logic errors.",
            "Errors: syntax errors break language rules, logic errors run but produce wrong results, and runtime errors occur during execution.",
            "Loop types: count-controlled loops repeat a fixed number of times, pre-condition loops test before running, and post-condition loops run before testing.",
            "Algorithm writing: pseudocode and flowcharts should use clear sequence, selection, iteration, input/output and assignments.",
            "Amending algorithms: corrections should match the scenario and preserve variable names, conditions and loop boundaries."
          ]
        }
      ]
    },
    {
      chapter: "8",
      title: "Programming",
      sections: [
        {
          code: "8.1",
          title: "Programming concepts",
          items: [
            "Variables and constants: variables store values that can change; constants store named values that should not change.",
            "Data types: common types include integer, real, Boolean, character and string; choose types that match the data.",
            "Operators: arithmetic operators calculate values, comparison operators test relationships, and Boolean operators combine or invert conditions.",
            "String handling: exam algorithms may use string length, substring/character access, concatenation and comparison.",
            "String routines: syllabus string operations include length, substring, upper and lower; the first character position may be 0 or 1 depending on the question.",
            "Input and output: INPUT gets data from the user or system, while OUTPUT displays or returns results.",
            "Sequence, selection and iteration: programs run ordered statements, choose branches with IF/CASE and repeat with FOR/WHILE/REPEAT loops.",
            "Nested statements: selection and iteration can be placed inside each other, but exam algorithms are limited in nesting depth.",
            "Procedures and functions: procedures perform actions, functions return values, and parameters pass data into subroutines.",
            "Parameters: values can be passed into procedures or functions so the same subroutine can work with different data.",
            "Local and global variables: local variables belong to one subroutine, while global variables can be accessed more widely in the program.",
            "Library routines: MOD gives a remainder, DIV gives integer division, ROUND rounds a value and RANDOM generates random values.",
            "Maintainability: meaningful identifiers, sensible subroutines and relevant comments make code easier to read, test and change."
          ]
        },
        {
          code: "8.2",
          title: "Arrays",
          items: [
            "1D arrays: store a list of related values under one identifier and access each element using an index.",
            "2D arrays: store tabular data using row and column indexes.",
            "Indexes: exams may use a first index of 0 or 1, so answers should follow the question's convention.",
            "Iteration with arrays: loops are commonly used to read, write, search, count or total array values."
          ]
        },
        {
          code: "8.3",
          title: "File handling",
          items: [
            "Purpose of files: files store data persistently so it can be used after a program stops.",
            "File operations: a file is opened before use, read from or written to, and closed after use.",
            "Reading data: programs may read a single item or a line of text from a file.",
            "Writing data: programs may write a single item or a full line of text to a file.",
            "Append vs write: append adds new data to the end of a file, while write may create or replace file contents depending on the mode."
          ]
        }
      ]
    },
    {
      chapter: "9",
      title: "Databases",
      sections: [
        {
          code: "9",
          title: "Single-table databases and SQL",
          items: [
            "Database structure: a database stores organised data in tables; each record is a row and each field is a column or attribute.",
            "Field names: good field names are meaningful, unique within the table, short and clear, such as StudentID or OrderDate rather than vague names like thing or date.",
            "Field data types: suitable types include text/string, character, Boolean, integer, real/decimal and date/time; the type should match the data and processing needed.",
            "Primary key: a field that uniquely identifies each record and must not be duplicated; it is not chosen because it is the most important-looking data.",
            "Validation checks: common database checks include range, type, length, presence, format and lookup checks; validation checks reasonableness, not whether data is definitely true.",
            "Searching and queries: a query finds records that match criteria such as Mark >= 50, House = \"Blue\" or combined conditions using AND/OR.",
            "Sorting: ascending means A-Z, smallest to largest or oldest to newest; descending means Z-A, largest to smallest or newest to oldest.",
            "SQL basics: SELECT chooses fields to display, FROM chooses the table, WHERE filters records and ORDER BY sorts the result.",
            "SQL calculations: SUM totals values and COUNT counts matching records in a single-table query.",
            "Forms and reports: forms make data entry and editing easier, often reducing errors with controls such as drop-down lists; reports present selected data in a clear layout for viewing or printing.",
            "Common mistakes: do not confuse records with fields, choose a non-unique primary key, sort in the wrong direction, write operators incorrectly such as = > instead of >=, or select every field when only specific fields are requested."
          ]
        }
      ]
    },
    {
      chapter: "10",
      title: "Boolean logic",
      sections: [
        {
          code: "10",
          title: "Logic gates, circuits, expressions and truth tables",
          items: [
            "Logic gates: NOT has one input; AND, OR, NAND, NOR and XOR/EOR have two inputs in this syllabus.",
            "Logic gate symbols: recognise and draw the standard symbols for NOT, AND, OR, NAND, NOR and XOR/EOR.",
            "Gate functions: AND is true only when both inputs are true; OR is true when at least one input is true; NOT inverts the input.",
            "Derived gates: NAND is NOT AND, NOR is NOT OR, and XOR/EOR is true when inputs are different.",
            "Truth tables: list every possible binary input combination and the resulting output.",
            "Logic circuits: circuits can be created from problem statements, logic expressions or truth tables.",
            "Logic expressions: expressions can be written from circuits, statements or truth tables using gate names.",
            "Building expressions from scenarios: identify each condition, choose the correct operator such as AND, OR or NOT, then add brackets for the intended order.",
            "Boolean notation: some textbook questions use algebra-style notation such as AND as a dot/product and OR as a plus sign; match the notation used in the question.",
            "Drawing circuits from expressions: work from brackets outward, draw each gate stage, and connect intermediate outputs to the final gate.",
            "Circuit limits: syllabus circuits are drawn without simplification and are limited to a maximum of three inputs and one output."
          ]
        }
      ]
    }
  ]
};

const chapterOneSections = [
  {
    number: "0",
    title: "How to Use This Sheet",
    tag: "Route",
    summary:
      "Work through Chapter 1 as a calculation-first topic: conversions, binary operations, representation, file-size maths, then compression choices.",
    bullets: [
      "Start with binary, denary, and hexadecimal fluency.",
      "Practise addition, overflow, shifts, and two's complement with working.",
      "Finish by applying file-size formulae and choosing compression methods."
    ],
    terms: ["conversion", "calculation", "keywords", "file size", "compression"]
  },
  {
    number: "1",
    title: "Recent Paper 1 Pattern Map",
    tag: "Exam Signals",
    summary:
      "Recent Paper 1 questions repeatedly reward accurate conversions, binary addition working, shift effects, image/sound file-size reasoning, and compression vocabulary.",
    bullets: [
      "Very high frequency: binary, denary, hexadecimal, lossless compression, and RLE.",
      "High frequency: binary addition, overflow, logical shift, colour depth, resolution, and lossy/lossless choice.",
      "Medium areas still matter: two's complement, sound size, ASCII, and Unicode."
    ],
    terms: ["binary", "overflow", "logical shift", "RLE", "Unicode"]
  },
  {
    number: "2",
    title: "Content Update Decision",
    tag: "Priorities",
    summary:
      "Keep the core syllabus content strong, but spend less time on niche detail that usually produces fewer marks.",
    bullets: [
      "Strengthen conversions, addition, overflow, shifts, two's complement, ASCII/Unicode, image/sound size, KiB/MiB/GiB, and compression.",
      "Downweight long memory-dump explanations, excessive storage-unit tables, deep lossy video details, and lookup-table compression.",
      "Avoid fixed claims such as Unicode always being exactly 16-bit; answer in terms of larger character sets and more bits."
    ],
    terms: ["keep", "strengthen", "downweight", "Unicode", "memory dumps"]
  },
  {
    number: "3",
    title: "One-Page Mind Map",
    tag: "Map",
    summary:
      "The chapter is best remembered as five linked clusters: number systems, binary operations, text/sound/image, storage maths, and compression.",
    bullets: [
      "Number systems: base 2, base 10, base 16, nibbles, and 8-bit range.",
      "Binary operations: addition, overflow, logical shift, and two's complement.",
      "Representation and storage: character sets, sampling, pixels, units, and file-size formulae."
    ],
    terms: ["base 2", "base 16", "nibble", "sampling", "colour depth"]
  },
  {
    number: "4",
    title: "1.1 Number Systems",
    tag: "Core",
    summary:
      "Computers use binary because circuits and transistors reliably represent two states; hexadecimal is a compact human-readable way to display binary.",
    bullets: [
      "Denary uses base 10; binary uses 0 and 1; hexadecimal uses 0-9 and A-F.",
      "Convert binary by adding place values; convert denary to 8-bit binary with leading zeros where required.",
      "Convert hexadecimal through 4-bit nibbles, and remember A = 10 and F = 15."
    ],
    terms: ["transistors", "two states", "8-bit", "hex digit", "HTML colours"]
  },
  {
    number: "5",
    title: "Binary Operations",
    tag: "Working",
    summary:
      "Show carries for addition, define overflow as a storage-limit problem, shift bits carefully, and treat the two's complement MSB as a negative place value.",
    bullets: [
      "Binary addition includes carry rules for 1 + 1 and 1 + 1 + 1.",
      "Overflow means the result is too large for the available bits, such as greater than 255 in unsigned 8-bit.",
      "Logical left shifts multiply by powers of 2; right shifts divide and discard bits shifted out."
    ],
    terms: ["carry", "overflow", "left shift", "right shift", "-128 column"]
  },
  {
    number: "6",
    title: "1.2 Text, Sound and Images",
    tag: "Media",
    summary:
      "Text is stored with character codes, sound with sampled amplitudes, and images with pixels whose colour is stored using a set number of bits.",
    bullets: [
      "ASCII is smaller; Unicode covers more languages, symbols, and emoji but may need more bits per character.",
      "Sample rate is samples per second; sample resolution is bits per sample.",
      "Image resolution is pixel count; colour depth is bits used for each pixel's colour."
    ],
    terms: ["character set", "ASCII", "Unicode", "sample rate", "pixel"]
  },
  {
    number: "7",
    title: "1.3 Data Storage and File Size",
    tag: "Formulae",
    summary:
      "File-size marks usually come from using the correct formula, converting bits to bytes, and using 1024 for KiB/MiB/GiB questions.",
    bullets: [
      "Image bits = width x height x colour depth.",
      "Sound bits = sample rate x sample resolution x duration x channels.",
      "1 byte = 8 bits; 1 KiB = 1024 bytes; 1 MiB = 1024 KiB."
    ],
    terms: ["bit", "nibble", "byte", "KiB", "MiB"]
  },
  {
    number: "8",
    title: "Compression",
    tag: "Choice",
    summary:
      "Compression reduces file size, storage, bandwidth, and transfer time; the exam often asks whether lossy or lossless is suitable for a scenario.",
    bullets: [
      "Lossless reduces size without permanent data loss, so the original can be restored.",
      "Lossy permanently removes data and is useful when smaller media files matter more than exact restoration.",
      "RLE stores adjacent repeated values as the value plus its repeat count."
    ],
    terms: ["less storage", "bandwidth", "lossless", "lossy", "RLE"]
  },
  {
    number: "9",
    title: "Mark Scheme Style Answer Templates",
    tag: "Wording",
    summary:
      "Short answers should use precise mark-scheme phrasing for hexadecimal, overflow, shifts, Unicode/ASCII, sampling, image size, and lossless compression.",
    bullets: [
      "Hexadecimal: shorter than binary, easier to read, and one hex digit maps to four bits.",
      "Sampling: amplitudes are measured regularly and stored as binary values.",
      "Lossless: file size is reduced without permanent data removal, and the original can be restored."
    ],
    terms: ["explain", "state", "more bits", "restore", "regular intervals"]
  },
  {
    number: "10",
    title: "Common Mistakes",
    tag: "Fixes",
    summary:
      "Most lost marks come from vague definitions, mixed-up units, or answers that describe an effect without saying why bits or storage change.",
    bullets: [
      "Do not say computers use binary just because they understand it; mention circuits, transistors, and two states.",
      "Do not define overflow as any carry; say the result cannot fit in the available bits.",
      "Do not mix sample rate with sample resolution, colour depth with resolution, or KiB with 1000."
    ],
    terms: ["vague", "carry", "sample resolution", "colour depth", "1024"]
  },
  {
    number: "11",
    title: "Scenario Answer Bank",
    tag: "Apply",
    summary:
      "Scenario questions ask students to choose a method and justify it using the data-loss, quality, speed, or exact-restoration requirement.",
    bullets: [
      "Use lossless for program code, text documents, medical images, or exact artwork.",
      "Use lossy for streaming music and web photos when smaller files and fast loading matter.",
      "Use RLE when adjacent repeated colours or values can be grouped efficiently."
    ],
    terms: ["scenario", "justify", "quality", "faster download", "exactly restored"]
  },
  {
    number: "12",
    title: "10 Marks Quick Check",
    tag: "Quiz",
    summary:
      "A fast self-test covers bases, 8-bit range, binary/hex conversion, overflow, shift effect, Unicode, colour depth, and compression.",
    bullets: [
      "Recall: binary is base 2 and unsigned 8-bit stores 0 to 255.",
      "Convert: 10101110 to hexadecimal and 3F to binary.",
      "Explain: overflow, a left shift by two places, Unicode advantage, colour depth, and compression purpose."
    ],
    terms: ["base 2", "255", "AE", "00111111", "x4"]
  },
  {
    number: "13",
    title: "20 Marks Exam-Style Practice",
    tag: "Practice",
    summary:
      "The longer practice set combines number systems, binary addition, image-size calculation, compression, sound-size calculation, sampling, and character sets.",
    bullets: [
      "Question 1: convert 182, convert binary/hex values, add binary numbers, and identify overflow.",
      "Question 2: calculate image size for 1024 x 768 at 16-bit colour depth, then explain colour depth and name RLE.",
      "Question 3: calculate sound size from sample rate, resolution, duration, and stereo channels."
    ],
    terms: ["182", "B6", "1536 KiB", "3528000 bytes", "stereo"]
  },
  {
    number: "14",
    title: "Teacher Appendix",
    tag: "Teaching",
    summary:
      "The teacher notes recommend frequent conversion drills, careful sequencing, and classroom tasks that turn definitions into mark-scoring answers.",
    bullets: [
      "Start lessons with short conversion drills, then teach addition and overflow together.",
      "Use file-size relay tasks and compression scenario sorting to build exam fluency.",
      "Train students to explain why file size changes and why exact restoration matters."
    ],
    terms: ["drills", "carry boxes", "relay race", "sorting", "marking guidance"]
  },
  {
    number: "15",
    title: "Final One-Page Exam Sheet",
    tag: "Condense",
    summary:
      "The final sheet compresses the chapter into definitions, operations, representation terms, formulae, and compression keywords.",
    bullets: [
      "Number systems: binary, denary, hexadecimal, nibbles, and unsigned 8-bit range.",
      "Representation: ASCII/Unicode, sample rate/resolution, image resolution, and colour depth.",
      "Compression: reduced file size, less bandwidth, faster transmission, lossy/lossless, and RLE."
    ],
    terms: ["one-page", "formulae", "operations", "keywords", "exam sheet"]
  }
];

const paperSessions = [
  { year: 2025, season: "March", code: "m", folder: "2025-march", components: ["12", "22"], open: true },
  { year: 2025, season: "May/June", code: "s", folder: "2025-may-june", components: ["11", "12", "13", "21", "22", "23"], open: true },
  { year: 2025, season: "Oct/Nov", code: "w", folder: "2025-oct-nov", components: ["11", "12", "13", "21", "22", "23"] },
  { year: 2024, season: "March", code: "m", folder: "2024-march", components: ["12", "22"] },
  { year: 2024, season: "May/June", code: "s", folder: "2024-may-june", components: ["11", "12", "13", "21", "22", "23"] },
  { year: 2024, season: "Oct/Nov", code: "w", folder: "2024-oct-nov", components: ["11", "12", "13", "21", "22", "23"] },
  { year: 2023, season: "March", code: "m", folder: "2023-march", components: ["12", "22"] },
  { year: 2023, season: "May/June", code: "s", folder: "2023-may-june", components: ["11", "12", "13", "21", "22", "23"] },
  { year: 2023, season: "Oct/Nov", code: "w", folder: "2023-oct-nov", components: ["11", "12", "13", "21", "22", "23"] },
  { year: 2022, season: "March", code: "m", folder: "2022-march", components: ["12", "22"] },
  { year: 2022, season: "May/June", code: "s", folder: "2022-may-june", components: ["11", "12", "13", "21", "22", "23"], legacy: true },
  { year: 2022, season: "Oct/Nov", code: "w", folder: "2022-oct-nov", components: ["11", "12", "13", "21", "22", "23"], legacy: true },
  { year: 2021, season: "March", code: "m", folder: "2021-march", components: ["12", "22"], legacy: true },
  { year: 2021, season: "May/June", code: "s", folder: "2021-may-june", components: ["11", "12", "13", "21", "22", "23"], legacy: true },
  { year: 2021, season: "Oct/Nov", code: "w", folder: "2021-oct-nov", components: ["11", "12", "13", "21", "22", "23"], legacy: true },
  { year: 2020, season: "March", code: "m", folder: "2020-march", components: ["12", "22"], legacy: true },
  { year: 2020, season: "May/June", code: "s", folder: "2020-may-june", components: ["11", "12", "13", "21", "22", "23"], legacy: true },
  { year: 2020, season: "Oct/Nov", code: "w", folder: "2020-oct-nov", components: ["11", "12", "13", "21", "22", "23"], legacy: true },
  { year: 2019, season: "March", code: "m", folder: "2019-march", components: ["12", "22"], legacy: true },
  { year: 2019, season: "May/June", code: "s", folder: "2019-may-june", components: ["11", "12", "13", "21", "22", "23"], legacy: true },
  { year: 2019, season: "Oct/Nov", code: "w", folder: "2019-oct-nov", components: ["11", "12", "13", "21", "22", "23"], legacy: true }
];

const accessStorageKey = "paperlensAccess";
const previewRecentPaperSessions = 1;

const state = {
  docs: [],
  results: [],
  checklist: [],
  questionMatches: [],
  selectedQuestionIds: new Set(),
  questionAccess: null,
  auth: loadAccessState()
};

const $ = (id) => document.getElementById(id);

$("targetScore")?.addEventListener("input", (event) => {
  $("targetLabel").textContent = `${event.target.value}%`;
});

$("analyzeBtn")?.addEventListener("click", analyzeMaterials);
$("refreshAnalysis")?.addEventListener("click", analyzeMaterials);
$("paperFocus")?.addEventListener("change", analyzeMaterials);
$("generateQuestions")?.addEventListener("click", renderPractice);
$("exportMarkdown")?.addEventListener("click", () => download("paperlens-checklist.md", checklistMarkdown(), "text/markdown"));
$("exportCsv")?.addEventListener("click", () => download("paperlens-checklist.csv", checklistCsv(), "text/csv"));
$("exportJson")?.addEventListener("click", () => download("paperlens-checklist.json", JSON.stringify(state.checklist, null, 2), "application/json"));
$("expandChapter")?.addEventListener("click", () => setChapterDetails(true));
$("collapseChapter")?.addEventListener("click", () => setChapterDetails(false));
$("loginForm")?.addEventListener("submit", handleLoginSubmit);
$("purchaseButton")?.addEventListener("click", buyLifetimeAccess);
$("topbarBuyButton")?.addEventListener("click", buyLifetimeAccess);
$("logoutButton")?.addEventListener("click", logoutAccess);
$("purchaseCloseButton")?.addEventListener("click", closePurchaseModal);
$("createCheckoutButton")?.addEventListener("click", createCheckoutLink);
$("knowledgeSearch")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const bestMatch = (await renderKnowledgeSearchResults($("knowledgeSearchInput").value))[0];
  if (bestMatch) locateKnowledgePoint(bestMatch, $("knowledgeSearchInput").value);
});
$("knowledgeSearchInput")?.addEventListener("input", (event) => {
  renderKnowledgeSearchResults(event.target.value);
});
$("questionFinderSearch")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await renderQuestionFinderResults($("questionFinderInput")?.value || "");
});
$("questionFinderInput")?.addEventListener("input", (event) => {
  if (!event.target.value.trim()) renderQuestionFinderResults("");
});
document.querySelectorAll(".question-syllabus-input").forEach((input) => {
  input.addEventListener("change", () => {
    clearQuestionSelection();
    state.questionMatches = [];
    const results = $("questionFinderResults");
    if (results) results.innerHTML = `<p class="question-empty-state">Enter a knowledge point to search the selected syllabus.</p>`;
  });
});
$("clearQuestionSelection")?.addEventListener("click", clearQuestionSelection);
$("downloadQuestionPdf")?.addEventListener("click", downloadSelectedQuestionPdf);
$("questionFinderBuyButton")?.addEventListener("click", buyLifetimeAccess);
$("questionImageCloseButton")?.addEventListener("click", closeQuestionImageModal);
$("questionImageModal")?.addEventListener("click", (event) => {
  if (event.target === event.currentTarget) closeQuestionImageModal();
});
document.addEventListener("click", handleQuestionPreviewClick);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeQuestionImageModal();
});
document.querySelectorAll("[data-question-suggestion]").forEach((button) => {
  button.addEventListener("click", async () => {
    const input = $("questionFinderInput");
    if (!input) return;
    input.value = button.dataset.questionSuggestion;
    input.focus();
    await renderQuestionFinderResults(input.value);
  });
});

async function analyzeMaterials() {
  const apiResult = await analyzeMaterialsFromApi();
  if (apiResult) {
    state.docs = apiResult.docs;
    state.results = apiResult.results;
    state.checklist = apiResult.checklist;
    renderSummary(apiResult.summary.wordCount);
    renderTopics();
    renderChecklist();
    renderPractice(apiResult.practicePrompts);
    return;
  }

  analyzeMaterialsLocally();
}

async function analyzeMaterialsFromApi() {
  if (!window.location.protocol.startsWith("http") || !$("paperFocus") || !$("targetScore")) return null;
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paperFocus: $("paperFocus").value,
        manual: $("manualText")?.value.trim() || "",
        threshold: $("targetScore").value
      })
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function analyzeMaterialsLocally() {
  const paperFocus = $("paperFocus").value;
  const manual = $("manualText").value.trim();
  state.docs = sourceLibrary
    .filter((source) => source.paper === undefined || source.paper === "both" || paperFocus === "both" || source.paper === paperFocus)
    .map((source) => ({ ...source, kind: source.paper || "source" }));
  if (manual) {
    state.docs.push({ name: "Admin notes", kind: "manual", text: manual });
  }

  const paperText = state.docs.map((doc) => doc.text).join("\n");
  const syllabusText = sourceLibrary.map((doc) => doc.text).join("\n");
  const allText = state.docs.map((doc) => doc.text).join("\n");
  const totalSignals = countWords(allText);

  state.results = topicBank
    .map((topic) => scoreTopic(topic, paperText, syllabusText, allText))
    .sort((a, b) => b.priority - a.priority);

  state.checklist = buildChecklist(state.results);
  renderSummary(totalSignals);
  renderTopics();
  renderChecklist();
  renderPractice();
}

function renderPastPaperCatalogs() {
  renderPastPaperArchive("pastPaperArchive");
  applyAccessState();
}

function renderSyllabusChecklists() {
  renderSyllabusChecklist("paper1Checklist", syllabusChecklist.paper1);
  renderSyllabusChecklist("paper2Checklist", syllabusChecklist.paper2);
  applyAccessState();
}

function renderSyllabusChecklist(containerId, chapters) {
  const container = $(containerId);
  if (!container) return;

  container.innerHTML = chapters
    .map((chapter) => {
      const chapterStats = probabilityForChapter(chapter);
      const locked = isLockedChapter(chapter);
      return `
      <article class="syllabus-chapter ${locked ? "is-locked" : ""}" id="${chapterId(chapter.chapter)}" data-access-locked="${locked}">
        <h3>
          <span>${chapter.chapter}. ${chapter.title}</span>
          ${probabilityBadge(chapterStats)}
        </h3>
        ${chapterSectionList(chapter)}
      </article>
    `;
    })
    .join("");
}

function chapterSectionList(chapter) {
  return `
    <div class="syllabus-section-list">
      ${chapter.sections
        .map((section) => {
          const sectionStats = probabilityForSection(section);
          return `
          <section class="syllabus-section" id="${sectionId(section.code)}">
            <h4>
              <span>${section.code} ${section.title}</span>
              ${probabilityBadge(sectionStats)}
            </h4>
            ${sectionChecklist(section)}
            ${sectionVisual(section)}
            ${sectionExamQuestions(section)}
          </section>
        `;
        })
        .join("")}
    </div>
  `;
}

function loadAccessState() {
  try {
    const stored = JSON.parse(localStorage.getItem(accessStorageKey) || "{}");
    return {
      loggedIn: false,
      purchased: false,
      user: null,
      ...stored,
      purchased: false
    };
  } catch {
    return { loggedIn: false, purchased: false, user: null };
  }
}

function saveAccessState() {
  localStorage.setItem(accessStorageKey, JSON.stringify(state.auth));
}

function hasFullAccess() {
  return Boolean(state.auth.loggedIn && state.auth.purchased);
}

function isLockedChapter(chapter) {
  return !hasFullAccess() && String(chapter.chapter) !== "1";
}

function lockedOverlay(message) {
  return `
    <div class="locked-overlay" aria-hidden="true">
      <span class="lock-icon">Lock</span>
      <strong>Premium content</strong>
      <p>${message}</p>
    </div>
  `;
}

function handleLoginSubmit(event) {
  event.preventDefault();
  const username = $("usernameInput")?.value.trim() || "";
  const email = $("emailInput")?.value.trim() || "";
  const password = $("passwordInput")?.value || "";

  if (!username || !email || password.length < 6) {
    updateLoginMessage("Please enter a username, valid email and at least 6 password characters.");
    return;
  }

  state.auth = {
    ...state.auth,
    loggedIn: true,
    user: { username, email }
  };
  saveAccessState();
  updateLoginMessage("Logged in. Buy lifetime access to unlock every checklist and paper.");
  applyAccessState();
}

function buyLifetimeAccess() {
  if (!state.auth.loggedIn) {
    window.location.href = "login.html?return=buy";
    return;
  }

  if (hasFullAccess()) return;
  openPurchaseModal();
}

async function logoutAccess() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
  } catch {}

  state.auth = { loggedIn: false, purchased: false, user: null };
  saveAccessState();
  $("loginForm")?.reset();
  updateLoginMessage("You are signed out. Preview mode is active.");
  refreshAccessControlledContent();
}

function updateLoginMessage(message) {
  const messageNode = $("loginMessage");
  if (messageNode) messageNode.textContent = message;
}

function openPurchaseModal() {
  const modal = $("purchaseModal");
  if (!modal) return;
  $("paymentLinkBox")?.setAttribute("hidden", "");
  updatePurchaseMessage("");
  modal.hidden = false;
}

function closePurchaseModal() {
  const modal = $("purchaseModal");
  if (modal) modal.hidden = true;
}

async function createCheckoutLink() {
  if (!state.auth.loggedIn) {
    window.location.href = "login.html?return=buy";
    return;
  }

  updatePurchaseMessage("Creating your payment link...");
  try {
    const response = await fetch("/api/billing/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401 || response.status === 404) {
        state.auth = { loggedIn: false, purchased: false, user: null };
        saveAccessState();
        window.location.href = "login.html?return=buy";
        return;
      }
      updatePurchaseMessage(data.error || "Could not create payment link.");
      return;
    }
    if (data.alreadyPurchased && data.user) {
      state.auth = { ...state.auth, purchased: true, user: data.user };
      saveAccessState();
      refreshAccessControlledContent();
      closePurchaseModal();
      return;
    }

    const paymentLink = $("paymentLink");
    const paymentLinkBox = $("paymentLinkBox");
    if (paymentLink && paymentLinkBox) {
      paymentLink.href = data.checkoutUrl;
      paymentLink.textContent = data.checkoutUrl;
      paymentLinkBox.hidden = false;
    }
    updatePurchaseMessage("Open the checkout link to finish payment.");
  } catch {
    updatePurchaseMessage("Could not reach the checkout server.");
  }
}

function updatePurchaseMessage(message) {
  const messageNode = $("purchaseMessage");
  if (messageNode) messageNode.textContent = message;
}

function applyAccessState() {
  document.body.classList.toggle("has-full-access", hasFullAccess());
  document.body.classList.toggle("is-logged-in", state.auth.loggedIn);
  updateAccountUi();
  updateLockedContent();
}

function refreshAccessControlledContent() {
  renderPastPaperArchive("pastPaperArchive");
  renderSyllabusChecklist("paper1Checklist", syllabusChecklist.paper1);
  renderSyllabusChecklist("paper2Checklist", syllabusChecklist.paper2);
  applyAccessState();
  loadQuestionFinderAccess();
}

async function syncAuthStateFromServer() {
  try {
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    if (!response.ok) {
      state.auth = { loggedIn: false, purchased: false, user: null };
      saveAccessState();
      refreshAccessControlledContent();
      return;
    }
    const data = await response.json();
    state.auth = {
      ...state.auth,
      loggedIn: true,
      purchased: Boolean(data.user.purchased),
      user: data.user
    };
    saveAccessState();
    refreshAccessControlledContent();
    loadQuestionFinderAccess();
  } catch {
    updateAccountUi();
  }
}

function updateAccountUi() {
  const status = $("accountStatus");
  const buyButton = $("topbarBuyButton");
  const logoutButton = $("logoutButton");
  const purchaseButton = $("purchaseButton");
  const accessMeter = $("accessMeter");
  document.querySelectorAll(".auth-guest-action").forEach((action) => {
    const hideGuestAction = Boolean(state.auth.loggedIn);
    action.hidden = hideGuestAction;
    action.style.display = hideGuestAction ? "none" : "";
  });

  if (status) {
    if (hasFullAccess()) status.textContent = `Logged in: ${state.auth.user?.username || "User"} - Lifetime access`;
    else if (state.auth.loggedIn) status.textContent = `Logged in: ${state.auth.user?.username || "User"} - Buy access to unlock`;
    else status.textContent = "Guest preview";
  }

  if (buyButton) {
    const hideBuyButton = hasFullAccess();
    buyButton.hidden = hideBuyButton;
    buyButton.style.display = hideBuyButton ? "none" : "";
    buyButton.textContent = "Buy access";
  }
  if (logoutButton) {
    logoutButton.hidden = !state.auth.loggedIn;
    logoutButton.style.display = state.auth.loggedIn ? "" : "none";
  }
  if (purchaseButton) {
    purchaseButton.textContent = hasFullAccess() ? "Purchased" : "Buy lifetime access";
    purchaseButton.disabled = hasFullAccess();
  }
  if (accessMeter) {
    accessMeter.innerHTML = hasFullAccess()
      ? "<span>Lifetime access</span><strong>Everything unlocked</strong>"
      : state.auth.loggedIn
        ? "<span>Logged in preview</span><strong>Purchase required for full access</strong>"
        : "<span>Preview mode</span><strong>Partial content visible</strong>";
  }
}

function updateLockedContent() {
  document.querySelectorAll("[data-access-locked]").forEach((node) => {
    const locked = node.dataset.accessLocked === "true" && !hasFullAccess();
    node.classList.toggle("is-locked", locked);
    node.setAttribute("aria-disabled", String(locked));
  });
}

function openPurchaseModalFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("buy") !== "1") return;
  if (!state.auth.loggedIn) {
    window.location.href = "login.html?return=buy";
    return;
  }
  if (!hasFullAccess()) {
    window.requestAnimationFrame(openPurchaseModal);
  }
}

function slugPart(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function chapterId(chapter) {
  return `chapter-${slugPart(chapter)}`;
}

function sectionId(code) {
  return `section-${slugPart(code)}`;
}

function sectionChecklist(section) {
  if (!section.items?.length) return "";

  return `
    <ul class="key-checklist">
      ${section.items.map((item) => `<li>${highlightKeywords(item)}</li>`).join("")}
    </ul>
  `;
}

function paperDownloadTargetForSection(section) {
  return "past-paper-archive";
}

function sectionExamQuestions(section) {
  const hits = pastPaperQuestionBank.filter((hit) => hit.section === section.code);
  const groups = hits.map((hit) => ({
    title: hit.knowledge,
    answer: hit.answer,
    hits: [hit],
    patterns: mergePastPaperHits([hit], hit.knowledge, hit.answer, section)
  }));

  if (!groups.length) return "";

  return `
    <div class="section-exam-bank">
      <h5>Exam question pastpaper</h5>
      ${groups
        .map(
          (group) => `
          <article class="exam-question-group">
            <div class="exam-pattern-list">
              ${group.patterns
                .map(
                  (pattern) => `
                  <details class="exam-pattern">
                    <summary>
                      <span class="pattern-meta">
                        <a class="knowledge-tag" href="#${sectionId(section.code)}">${pattern.knowledge}</a>
                        ${pattern.sources
                          .map((source) => paperSourceTag(source, section))
                          .join("")}
                      </span>
                      <span class="pattern-question">${pattern.question}</span>
                    </summary>
                    ${patternAnswerMarkup(pattern.answer)}
                  </details>
                `
                )
                .join("")}
            </div>
          </article>
        `
        )
        .join("")}
    </div>
  `;
}

function patternAnswerMarkup(answer) {
  if (!answer.includes(";")) {
    return `<p class="pattern-answer">${highlightKeywords(answer)}</p>`;
  }

  const labelMatch = answer.match(/^\s*(MS(?:\s+terms)?):\s*/i);
  const label = labelMatch ? labelMatch[1] : "MS";
  const answerBody = labelMatch ? answer.slice(labelMatch[0].length) : answer;
  const points = answerBody
    .split(";")
    .map((point) => point.trim())
    .filter(Boolean);

  return `
    <div class="pattern-answer pattern-answer-points">
      <span class="answer-label">${label} points</span>
      <ul>
        ${points.map((point) => `<li>${highlightKeywords(point)}</li>`).join("")}
      </ul>
    </div>
  `;
}

function mergePastPaperHits(hits, title, answer, section) {
  const merged = new Map();
  hits.forEach((hit) => {
    const key = normaliseExamIntent(hit.knowledge || title, hit.answer || answer);
    const existing = merged.get(key) || {
      knowledge: hit.knowledge || title,
      knowledgeHref: `#${sectionId(section.code)}`,
      sources: [],
      questions: [],
      answers: []
    };
    existing.sources.push(hit.ref ? `${hit.paper} ${hit.ref}`.trim() : hit.paper);
    existing.questions.push(hit.question);
    existing.answers.push(hit.answer || answer);
    merged.set(key, existing);
  });

  return Array.from(merged.values()).map((pattern) => ({
    ...pattern,
    sources: Array.from(new Set(pattern.sources)),
    question: mergedQuestionText(pattern.questions),
    answer: mergedAnswerText(pattern.answers)
  }));
}

function normaliseExamIntent(knowledge, answer) {
  const lower = `${knowledge} ${answer}`.toLowerCase();
  if (lower.includes("number systems")) return "number-systems";
  if (lower.includes("conversions")) return "conversions";
  if (lower.includes("binary") && (lower.includes("logic circuit") || lower.includes("0s and 1s") || lower.includes("two stable"))) {
    return "why-binary";
  }
  if (lower.includes("binary addition and overflow")) return "binary-addition-overflow";
  if (lower.includes("overflow definition")) return "overflow-definition";
  if (lower.includes("overflow")) return "overflow";
  if (lower.includes("logical shift")) return "logical-shift";
  return lower.replace(/[^a-z0-9]+/g, "-");
}

function mergedQuestionText(questions) {
  const cleaned = Array.from(new Set(questions.map((question) => question.trim())));
  return cleaned.length === 1 ? cleaned[0] : cleaned.join(" / ");
}

function mergedAnswerText(answers) {
  const cleaned = Array.from(new Set(answers.map((answer) => answer.trim())));
  return cleaned.join(" ");
}

function paperSourceTag(source, section) {
  const paper = sourcePaperFromLabel(source);
  const target = paper ? paperChipIdFromPaper(paper, "qp") : paperDownloadTargetForSection(section);
  const data = paper ? ` data-paper="${paper}"` : "";
  return `<a class="paper-source-tag" href="#${target}"${data}>${source}</a>`;
}

function sourcePaperFromLabel(source) {
  const match = source.match(/^0478\/\d{2}\/(?:F\/M|M\/J|O\/N)\/\d{2}/);
  return match ? match[0] : "";
}

function paperParts(paper) {
  const match = paper.match(/^0478\/(\d{2})\/(F\/M|M\/J|O\/N)\/(\d{2})$/);
  if (!match) return null;
  const [, component, season, year] = match;
  const seasonCode = { "F/M": "m", "M/J": "s", "O/N": "w" }[season];
  return { component, seasonCode, year };
}

function paperChipIdFromPaper(paper, type) {
  const parts = paperParts(paper);
  if (!parts) return "";
  return `paper-chip-0478-${parts.seasonCode}${parts.year}-${type}-${parts.component}`;
}

function paperPdfUrl(session, type, component) {
  return `textbook_syllabus/pastpaper/${encodeURIComponent(localPastPaperFolder(session))}/${localPaperFilename(session, type, component)}`;
}

function localPastPaperFolder(session) {
  const seasonFolder = session.season.replace("/", "-");
  const folder = `${session.year}-${seasonFolder}`;
  return session.year === 2020 && session.season === "May/June" ? `${folder} ` : folder;
}

function localPaperFilename(session, type, component) {
  return `0478_${session.code}${String(session.year).slice(-2)}_${type}_${component}.pdf`;
}

const missingLocalPastPaperFiles = new Set([
  "0478_s19_ms_11.pdf",
  "0478_s19_ms_12.pdf",
  "0478_s19_ms_13.pdf",
  "0478_w19_qp_13.pdf",
  "0478_w19_qp_21.pdf",
  "0478_w19_qp_22.pdf"
]);

function hasLocalPaperFile(session, type, component) {
  if (type === "pm") {
    return session.year === 2019 && ["s", "w"].includes(session.code) && component.startsWith("2");
  }

  return !missingLocalPastPaperFiles.has(localPaperFilename(session, type, component));
}

const pastPaperQuestionBank = [
  {
    section: "1.1",
    paper: "0478/12/F/M/25",
    ref: "Q1(a)-1(c)",
    question: "Complete number-system statements, add two 8-bit binary numbers, and identify overflow.",
    knowledge: "Number systems, binary addition and overflow",
    answer:
      "MS: binary base 2; smallest 8-bit denary 0; largest 255; hexadecimal base 16; one hex digit is 4 bits; 10 is A; 15 is F. Overflow: answer too large for available bits."
  },
  {
    section: "1.1",
    paper: "0478/12/M/J/25",
    ref: "Q1(c)-1(g)",
    question: "Convert denary and hexadecimal values, add binary numbers, explain overflow, and give an 8-bit two's-complement value.",
    knowledge: "Conversions and two's complement",
    answer:
      "MS: 19 = 10011; 230 = 11100110; 35 hex = 0011 0101; 8AD hex = 1000 1010 1101; binary addition result 11010101; overflow occurs when result is greater than 255 or cannot fit in 8 bits; -22 = 11101010."
  },
  {
    section: "1.2",
    paper: "0478/13/M/J/25",
    ref: "Q1(a)-1(e)",
    question: "Answer questions on sound input, binary/hex conversion, logical shift, two's complement, and sound sampling terms.",
    knowledge: "Text and sound representation",
    answer:
      "MS: microphone; 00011001 = 25; 10110100 = 180; hex values 19 and B4; right shift result 00101001; two's complement 11001001 = -55; sampling measures amplitude at regular intervals; sample rate is samples per second; sample resolution is bits per sample."
  },
  {
    section: "1.2",
    paper: "0478/12/F/M/25",
    ref: "Q2(a)-2(c)",
    question: "State colour depth, describe resolution/file-size relationship, and explain lossless image compression.",
    knowledge: "Image representation and compression",
    answer:
      "MS: colour depth is bits per colour or number of colours represented. Higher resolution means more pixels, more bits, and a larger file. Lossless retains data; lossy reduces quality; RLE identifies repeated pixels/patterns and stores repetitions with colour code."
  },
  {
    section: "1.3",
    paper: "0478/12/O/N/24",
    ref: "Q2(a)-2(d)",
    question: "Identify storage units, calculate sound-file size in KiB, and explain file compression benefits.",
    knowledge: "Storage units, file size and compression",
    answer:
      "MS: smallest unit is bit; 2 bytes = 4 nibbles; sound size uses sample rate x sample resolution x duration, then divide by 8 and by 1024 for KiB; compression reduces file size and saves storage."
  },
  {
    section: "2.1",
    paper: "0478/12/F/M/25",
    ref: "Q2(d)",
    question: "Explain packet switching and annotate serial full-duplex versus parallel simplex transmission.",
    knowledge: "Packets and transmission methods",
    answer:
      "MS: data split into fixed-size packets; payload, header and trailer used; header may include destination IP and packet number; routers direct packets; packets can take different routes, arrive out of order, and are reordered. Serial uses one wire; parallel uses multiple wires; full-duplex is both ways at once; simplex is one way."
  },
  {
    section: "2.2",
    paper: "0478/13/M/J/25",
    ref: "Q7(a)-7(b)",
    question: "Describe transmission errors and complete statements about parity, echo check and ARQ.",
    knowledge: "Error detection methods",
    answer:
      "MS: interference/crosstalk can cause data loss, gain, or change. Parity can be odd/even; a parity bit is added to each byte. Echo check compares sent data with data received back. ARQ uses acknowledgement and timeout; acknowledgement can be positive or negative."
  },
  {
    section: "2.3",
    paper: "0478/12/F/M/24",
    ref: "Q7(a)",
    question: "State the purpose of encryption and describe symmetric/asymmetric encryption differences.",
    knowledge: "Encryption",
    answer:
      "MS: encrypted data cannot be understood if intercepted. Symmetric uses a shared key to encrypt and decrypt. Asymmetric uses public and private keys; public key encrypts and private key decrypts."
  },
  {
    section: "3.1",
    paper: "0478/12/M/J/25",
    ref: "Q4(a)-4(b)",
    question: "Complete CPU component descriptions and explain why a general-purpose computer is not an embedded system.",
    knowledge: "CPU architecture and embedded systems",
    answer:
      "MS: CU manages data flow; ALU carries out arithmetic/logic; cache stores frequently used data/instructions; PC stores next-instruction address; clock controls FDE cycles per second; MDR stores data before/after RAM transfer. Embedded systems are dedicated/limited-function, use dedicated hardware, are not easily reprogrammed, may use a microprocessor, and can be built into a larger device."
  },
  {
    section: "3.2",
    paper: "0478/12/F/M/25",
    ref: "Q4(a)-4(c)",
    question: "Choose an ATM sensor, describe microprocessor role, explain embedded-system features, and identify accessible input/output devices.",
    knowledge: "Input/output devices and sensors",
    answer:
      "MS: infrared/proximity sensor; microprocessor receives sensor data, calculates distance, compares with stored 1 m value, and sends signal to display a welcome message. Embedded features include dedicated function/hardware, firmware, not easily reprogrammed, and microprocessor. Accessible devices include microphone or braille keyboard/pad and speaker."
  },
  {
    section: "3.2",
    paper: "0478/12/O/N/19",
    ref: "Q6",
    question: "Classify resistive and capacitive touch-screen statements and describe how touch is registered.",
    knowledge: "Touch screen technologies",
    answer:
      "Special past-paper focus: resistive screens use pressure to push two conductive layers together, can work with gloves/stylus and are usually cheaper; capacitive screens use changes in electrical charge from a finger and can support multi-touch."
  },
  {
    section: "3.2",
    paper: "0478/11/O/N/19",
    ref: "Q1(a)-1(b)",
    question: "Match inkjet and laser printer features, including toner, charged drum, print head and colour output.",
    knowledge: "Printer technologies",
    answer:
      "Special past-paper focus: laser printers use a charged drum and powdered toner; inkjet printers spray ink droplets through a print head and can produce colour output."
  },
  {
    section: "3.2",
    paper: "0478/12/F/M/19",
    ref: "Q4",
    question: "Identify OCR, OMR, MICR and barcode/QR style input methods from practical data-capture scenarios.",
    knowledge: "Specialised input devices",
    answer:
      "Special past-paper focus: OCR reads printed characters, OMR detects shaded marks, MICR reads magnetic-ink characters, and barcode/QR scanners read encoded patterns quickly and accurately."
  },
  {
    section: "3.3",
    paper: "0478/13/M/J/25",
    ref: "Q2(a)-2(c)",
    question: "Identify virtual memory, describe magnetic storage, and explain why HDD is secondary storage.",
    knowledge: "Memory and secondary storage",
    answer:
      "MS: partitioned secondary storage used as virtual memory. Magnetic storage features include tracks/sectors, rotating platters, moving parts, read/write head, electromagnet, and magnetised dots. Secondary storage is not directly accessed by CPU and is non-volatile/permanent until deleted."
  },
  {
    section: "3.4",
    paper: "0478/12/F/M/25",
    ref: "Q5(a)-5(b)",
    question: "Describe NIC purposes, MAC-address characteristics, and IP-address allocation.",
    knowledge: "Network hardware and addressing",
    answer:
      "MS: NIC transmits/receives data, allows physical connection, converts data for computer/network, and may be assigned an IP address. MAC address is hexadecimal, separated by colons/hyphens, six groups/twelve hex digits/48 bits, contains manufacturer ID and unique device number, and is static. Router can automatically assign IP address."
  },
  {
    section: "4.1",
    paper: "0478/13/M/J/25",
    ref: "Q4(a)-4(c)",
    question: "Describe OS interrupt handling, other OS functions, and hardware/software interrupt examples.",
    knowledge: "Operating systems and interrupts",
    answer:
      "MS: OS assigns interrupt priority, uses an interrupt handler/ISR, and maintains the interrupt queue. OS functions include file management, interface, peripherals/drivers, memory, multitasking, platform for applications, security, and user accounts. Hardware interrupts include key press, mouse click, printer out of ink; software interrupts include division by zero or memory-access conflict."
  },
  {
    section: "4.2",
    paper: "0478/12/M/J/25",
    ref: "Q3(a)-3(b)",
    question: "Give reasons for high-level languages, complete compiler/interpreter statements, and identify IDE functions.",
    knowledge: "Languages, translators and IDEs",
    answer:
      "MS: high-level languages are easier to debug, less error-prone, and portable. Compiler translates whole code before executing and reports all errors; interpreter translates/executes line by line and stops at an error. IDE functions include code editor, run-time environment, error diagnostics, auto-completion, auto-correction and prettyprint/syntax highlighting."
  },
  {
    section: "5.1",
    paper: "0478/12/M/J/25",
    ref: "Q5(c)",
    question: "Complete/annotate the process of requesting a web page and explain SSL secure connection.",
    knowledge: "Web, DNS and SSL",
    answer:
      "MS: browser sends URL/domain to DNS; DNS searches for matching IP or forwards to another DNS; IP address returns to computer; request goes to web server; HTML/web page data returns. SSL establishes encrypted connection using asymmetric encryption; server sends digital certificate; browser validates it before transaction begins."
  },
  {
    section: "5.1",
    paper: "0478/12/O/N/20",
    ref: "Q1",
    question: "Define HTML as a web-authoring language and identify CSS/presentation features for web pages.",
    knowledge: "Web authoring and CSS",
    answer:
      "Special past-paper focus: HTML creates the structure/content of web pages; CSS controls presentation such as formatting, colour, layout and reusable stylesheets across multiple pages."
  },
  {
    section: "5.2",
    paper: "0478/12/F/M/24",
    ref: "Q5",
    question: "Complete the description of digital currencies and blockchains.",
    knowledge: "Digital currency and blockchain",
    answer:
      "MS terms: physically; blockchains; time-stamp; traced. Digital currency is accessed electronically; blockchains are decentralised ledgers where transactions are stored as linked data with time-stamps, cannot be altered, and can be traced."
  },
  {
    section: "5.3",
    paper: "0478/13/M/J/25",
    ref: "Q5(b)-5(d)",
    question: "Choose a login security method, explain a DDoS attack, identify proxy-server tasks, and answer cookie/browser questions.",
    knowledge: "Cyber security, cookies and proxy servers",
    answer:
      "MS: two-step verification improves login security. DDoS: malware turns computers into bots, creating a botnet; attacker initiates requests; web server cannot handle them and crashes. Proxy server tasks: hide public IP address and caching. Persistent cookies keep cart items; cookies can store login/payment details/preferences and support targeted advertising."
  },
  {
    section: "5.3",
    paper: "0478/12/F/M/20",
    ref: "Q2(d)",
    question: "Suggest methods to keep data safe, including backups, anti-virus, firewalls, passwords, biometrics, two-factor authentication and access rights.",
    knowledge: "Security software and access controls",
    answer:
      "Special past-paper focus: backups allow recovery after data loss; anti-virus/anti-malware detects and removes malicious software; firewalls restrict unauthorised network traffic; access rights and authentication limit who can view or change data."
  },
  {
    section: "5.3",
    paper: "0478/11/O/N/21",
    ref: "Q5(a)",
    question: "Identify security methods such as encryption, biometric devices, firewalls, anti-spyware and two-step verification.",
    knowledge: "Anti-spyware and security methods",
    answer:
      "Special past-paper focus: anti-spyware detects or removes software that secretly monitors activity or collects personal data; it complements firewalls, encryption and authentication methods."
  },
  {
    section: "6.1",
    paper: "0478/13/M/J/25",
    ref: "Q6(a)-6(e)",
    question: "Answer questions about an automated weather station using sensors, microprocessor, serial simplex transmission, and employee impacts.",
    knowledge: "Automated systems",
    answer:
      "MS: components include microprocessor, actuator, storage/memory; sensors include humidity, light, level, infrared. Microprocessor receives sensor data, compares with stored threshold, and sends alert signal. Serial simplex sends one bit at a time down a single wire in one direction. Benefits include less repetitive/night/adverse-weather work; disadvantages include deskilling or job replacement."
  },
  {
    section: "6.2",
    paper: "0478/12/M/J/25",
    ref: "Q5(b)",
    question: "Identify robot components and explain advantages/disadvantages of surgical robots.",
    knowledge: "Robotics",
    answer:
      "MS: electrical components include sensors, microprocessors and actuators. Advantages include remote surgery, specialist access, reduced waiting/travel, precision, smaller incision, shorter recovery, safer/hygienic work and higher success rate. Disadvantages include connection loss/delay, high cost, hacking risk, corrupted transmitted data and hardware malfunction."
  },
  {
    section: "6.3",
    paper: "0478/12/M/J/25",
    ref: "Q5(a)",
    question: "Describe how an expert system decides a medical diagnosis.",
    knowledge: "Expert systems",
    answer:
      "MS: inference engine decides questions based on previous input; symptoms are compared with the knowledge base; rule base is applied to the knowledge base to decide the diagnosis."
  },
  {
    section: "7.1",
    paper: "0478/22/F/M/25",
    ref: "Q3",
    question: "Match development life cycle stages to descriptions.",
    knowledge: "Program development life cycle",
    answer:
      "MS: analysis identifies problem and requirements; design uses structure diagrams, flowcharts and pseudocode to plan; coding uses a programming language to create the solution; testing makes sure program code works as expected."
  },
  {
    section: "7.1",
    paper: "0478/21/M/J/20",
    ref: "Q2",
    question: "Identify true statements about structure diagrams and how they show a system hierarchy.",
    knowledge: "Structure diagrams",
    answer:
      "Special past-paper focus: structure diagrams are design tools that show a hierarchy and relationships between components/sub-systems; they are not program code or arrays."
  },
  {
    section: "7.1",
    paper: "0478/21/M/J/19",
    ref: "Pre-release material",
    question: "Use pre-release scenario material to prepare practical programming tasks before the Paper 2 examination.",
    knowledge: "Legacy pre-release tasks",
    answer:
      "Special legacy focus: older Paper 2 papers expected candidates to understand the pre-release scenario, identify inputs, storage, validation, processing and outputs, then apply that preparation to the exam questions."
  },
  {
    section: "7.2",
    paper: "0478/22/F/M/25",
    ref: "Q4-5",
    question: "State validation-check purposes, write integer-validation pseudocode, and complete a test-data table.",
    knowledge: "Validation and test data",
    answer:
      "MS: presence check verifies a value has been entered; integer input uses a type check; validation algorithm needs condition-controlled loop, input/re-input, integer test, error message and termination. Test data: abnormal rejects too short, boundary tests just too short/at correct length, normal accepts appropriate length."
  },
  {
    section: "7.3",
    paper: "0478/22/F/M/25",
    ref: "Q6-7",
    question: "Correct pseudocode errors, output rounded average, trace a flowchart and identify input-related errors.",
    knowledge: "Trace tables and algorithm errors",
    answer:
      "MS: corrections include Highest as INTEGER, Highest initialised to 0, Total plus Numbers[Count], compare with Highest, average uses Total/1000; rounded output uses ROUND(Total / 1000, 2). Trace outputs include -2, 60 and 5; purpose is a calculator. Input errors include unhandled operator values, division by zero, wrong data type, no data and no prompts."
  },
  {
    section: "8.1",
    paper: "0478/22/F/M/25",
    ref: "Q4(b), Q6, Q10",
    question: "Write validation pseudocode and a program using menu, selection, iteration, validation, arrays and comments.",
    knowledge: "Programming constructs",
    answer:
      "MS: use REPEAT/WHILE loops, INPUT, IF selection, error messages and loop termination. Large program requirements: display menu, validate choice, check six-character code length, check uniqueness against stored codes, store code/name data, output member details, repeat until stop, and use meaningful identifiers/comments."
  },
  {
    section: "8.2",
    paper: "0478/22/F/M/25",
    ref: "Q6, Q10",
    question: "Use one-dimensional and two-dimensional arrays to store numbers and membership details.",
    knowledge: "Arrays",
    answer:
      "MS: Numbers is ARRAY[1:1000] OF INTEGER; access with Numbers[Count]; MemberID[] stores membership codes; Name[] stores first/last names in corresponding 2D positions; arrays/lists are required data structures."
  },
  {
    section: "8.3",
    paper: "0478/22/F/M/25",
    ref: "Q2",
    question: "Choose the pseudocode statement to store a hotel name held in variable Name to a text file.",
    knowledge: "File handling",
    answer: "MS: WRITEFILE Hotels.txt, Name."
  },
  {
    section: "9",
    paper: "0478/22/F/M/25",
    ref: "Q8(a)-8(d)",
    question: "Answer database field/record questions, choose a primary key, give SQL output, and complete an SQL query.",
    knowledge: "Databases and SQL",
    answer:
      "MS: 6 fields and 23 records; primary key Code because it is unique. SQL output for South America ordered by Population: Valencia Venezuela 1,983,445; Lima Peru 11,206,000; Buenos Aires Argentina 15,490,415. Capital-city query selects Code, City, Country, Continent FROM MajorCity WHERE Capital = TRUE."
  },
  {
    section: "10",
    paper: "0478/22/F/M/25",
    ref: "Q9(a)-9(b)",
    question: "Draw a logic circuit and complete a truth table for Z = (A NAND B) XOR (NOT (NOT B NAND C)).",
    knowledge: "Logic gates and truth tables",
    answer:
      "MS: circuit requires correct NAND, NOT, NAND, NOT and XOR stages with correct inputs. Truth table Z values for rows 000 to 111: 1, 0, 1, 1, 1, 0, 0, 0."
  },
  {
    section: "10",
    paper: "0478/22/M/J/23",
    ref: "Q2",
    question: "Match logic gate names to standard symbols.",
    knowledge: "Logic gate symbols",
    answer:
      "Special past-paper focus: recognise and draw the standard symbols for AND, OR, NOT, NAND, NOR and XOR/EOR before building circuits or completing truth tables."
  }
];

renderPastPaperCatalogs();
renderSyllabusChecklists();
renderChapterOne();
renderKnowledgeSearchResults("");
renderQuestionFinderResults("");
renderSidebarNav();
syncAuthStateFromServer();
loadQuestionFinderAccess();
document.querySelectorAll(".nav-toggle[data-href]").forEach((toggle) => {
  toggle.addEventListener("click", handleNavToggleClick);
});
document.addEventListener("click", handlePaperSourceClick);
document.addEventListener("click", handleAnchorClick);
window.addEventListener("load", () => {
  if (window.location.hash) scrollToAnchorTarget(window.location.hash, { behavior: "auto", updateHistory: false });
  openPurchaseModalFromUrl();
});
window.addEventListener("hashchange", () => {
  if (window.location.hash) scrollToAnchorTarget(window.location.hash, { behavior: "auto", updateHistory: false });
});

function handleAnchorClick(event) {
  const link = event.target.closest('a[href^="#"]');
  if (!link || link.classList.contains("paper-source-tag")) return;

  const target = targetFromHash(link.hash);
  if (!target) return;

  event.preventDefault();
  scrollToAnchorTarget(link.hash);
}

function handleNavToggleClick(event) {
  const toggle = event.currentTarget;
  event.preventDefault();
  const branch = toggle.closest(".nav-branch");
  const shouldOpen = branch ? !branch.classList.contains("is-open") : true;
  if (branch) branch.classList.toggle("is-open", shouldOpen);
  window.requestAnimationFrame(() => {
    scrollToAnchorTarget(toggle.dataset.href, { expandSidebar: shouldOpen });
  });
}

function targetFromHash(hash) {
  if (!hash || hash === "#") return null;

  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return document.getElementById(hash.slice(1));
  }
}

function scrollToAnchorTarget(hash, options = {}) {
  const target = targetFromHash(hash);
  if (!target) return;

  target.closest("details")?.setAttribute("open", "");
  if (options.expandSidebar !== false) openSidebarBranch(hash);
  const offset = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--anchor-offset")) || 0;
  const scrollContainer = target.closest(".page-content");
  if (scrollContainer) {
    const containerTop = scrollContainer.getBoundingClientRect().top;
    const targetTop = target.getBoundingClientRect().top - containerTop + scrollContainer.scrollTop - offset;
    scrollContainer.scrollTo({ top: Math.max(targetTop, 0), behavior: options.behavior || "smooth" });
  } else {
    const targetTop = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(targetTop, 0), behavior: options.behavior || "smooth" });
  }

  if (options.updateHistory !== false && window.history.pushState) {
    window.history.pushState(null, "", hash);
  }
}

function openSidebarBranch(hash) {
  const branch = [...document.querySelectorAll(".nav-branch")].find(
    (group) => group.querySelector(`[href="${hash}"]`) || group.querySelector(`.nav-toggle[data-href="${hash}"]`)
  );
  if (branch) {
    branch.classList.add("is-open");
    branch.closest(".checklist-nav-branch")?.classList.add("is-open");
  }
}

function renderSidebarNav() {
  const nav = $("sidebarNav");
  if (!nav) return;

  const paperGroups = [
    {
      title: "Paper 1: Theory",
      paperId: "paper-1",
      checklistId: "paper-1-checklist",
      chapters: syllabusChecklist.paper1
    },
    {
      title: "Paper 2: Algorithms and programming",
      paperId: "paper-2",
      checklistId: "paper-2-checklist",
      chapters: syllabusChecklist.paper2
    }
  ];

  nav.innerHTML = `
    <a class="nav-link level-0" href="#home">Home</a>
    <a class="nav-link level-0" href="#question-finder">Question finder</a>
    <a class="nav-link level-0" href="#igcse-0478">IGCSE 0478</a>
    <a class="nav-link level-1" href="#past-paper-archive">Past paper archive</a>
    ${paperGroups.map(sidebarPaperGroup).join("")}
  `;
}

function sidebarPaperGroup(group) {
  return `
    <a class="nav-link level-1" href="#${group.paperId}">${group.title}</a>
    <div class="nav-branch checklist-nav-branch">
      <button class="nav-link level-2 nav-toggle" type="button" data-href="#${group.checklistId}">Checklist</button>
      <div class="checklist-nav-children">
        ${group.chapters.map(sidebarChapterBranch).join("")}
      </div>
    </div>
  `;
}

function sidebarChapterBranch(chapter) {
  return `
    <div class="nav-branch">
      <button class="nav-link level-3 nav-toggle" type="button" data-href="#${chapterId(chapter.chapter)}">
        ${chapter.chapter}. ${chapter.title}
      </button>
      ${chapter.sections
        .map((section) => `<a class="nav-link level-4" href="#${sectionId(section.code)}">${section.code} ${section.title}</a>`)
        .join("")}
    </div>
  `;
}

function sectionKnowledgeItems(section) {
  return section.items;
}

function knowledgeSearchIndex() {
  const syllabusEntries = Object.entries(syllabusChecklist).flatMap(([paper, chapters]) =>
    chapters.flatMap((chapter) =>
      chapter.sections.flatMap((section) => {
        const context = `${paper === "paper1" ? "Paper 1 Theory" : "Paper 2 Algorithms"} · Chapter ${chapter.chapter}: ${chapter.title}`;
        const sectionTarget = sectionId(section.code);
        const sectionEntry = {
          title: `${section.code} ${section.title}`,
          context,
          body: `${chapter.title} ${section.title} ${section.items.join(" ")}`,
          targetId: sectionTarget,
          matchType: "section"
        };
        const itemEntries = section.items.map((item, index) => ({
          title: item.split(":")[0],
          context: `${context} · ${section.code} ${section.title}`,
          body: item,
          targetId: sectionTarget,
          matchType: `knowledge-${index + 1}`
        }));
        return [sectionEntry, ...itemEntries];
      })
    )
  );

  const chapterOneEntries = chapterOneSections.map((section) => ({
    title: section.title,
    context: `Chapter 1 guide · ${section.tag}`,
    body: `${section.summary} ${section.bullets.join(" ")} ${section.terms.join(" ")}`,
    targetId: chapterOneId(section.number),
    matchType: "chapter-guide"
  }));

  const topicEntries = topicBank.map((topic) => ({
    title: topic.name,
    context: "Revision analyzer topic",
    body: `${topic.name} ${topic.keywords.join(" ")} ${topic.focus}`,
    targetId: "igcse-0478",
    matchType: "topic-bank"
  }));

  return [...syllabusEntries, ...chapterOneEntries, ...topicEntries].map((entry) => ({
    ...entry,
    searchText: normaliseSearchText(`${entry.title} ${entry.context} ${entry.body}`),
    tokens: searchTokens(`${entry.title} ${entry.context} ${entry.body}`)
  }));
}

async function renderKnowledgeSearchResults(query) {
  const resultsContainer = $("knowledgeSearchResults");
  const status = $("knowledgeSearchStatus");
  if (!resultsContainer || !status) return [];

  const trimmed = query.trim();
  if (!trimmed) {
    status.textContent = "Type a term to locate any knowledge point.";
    resultsContainer.innerHTML = "";
    return [];
  }

  const matches = (await findKnowledgeMatchesFromApi(trimmed)) || findKnowledgeMatches(trimmed);
  const exactCount = matches.filter((match) => match.isExact).length;
  status.textContent = exactCount
    ? `${exactCount} exact match${exactCount === 1 ? "" : "es"} found.`
    : matches.length
      ? "No exact match. Showing related knowledge points."
      : "No related knowledge point found.";

  resultsContainer.innerHTML = matches
    .slice(0, 6)
    .map(
      (match, index) => `
      <button class="search-result" type="button" data-search-index="${index}">
        <strong>${highlightSearchTerm(escapeHtml(match.title), trimmed)}</strong>
        <span>${highlightSearchTerm(escapeHtml(match.context), trimmed)}</span>
      </button>
    `
    )
    .join("");

  resultsContainer.querySelectorAll(".search-result").forEach((button) => {
    button.addEventListener("click", () => {
      const match = matches[Number(button.dataset.searchIndex)];
      if (match) locateKnowledgePoint(match, trimmed);
    });
  });

  return matches;
}

async function findKnowledgeMatchesFromApi(query) {
  if (!window.location.protocol.startsWith("http")) return null;
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.matches;
  } catch {
    return null;
  }
}

function findKnowledgeMatches(query) {
  const normalisedQuery = normaliseSearchText(query);
  const queryTokens = searchTokens(query);
  if (!normalisedQuery || !queryTokens.length) return [];

  return knowledgeSearchIndex()
    .map((entry) => {
      const exactPhrase = entry.searchText.includes(normalisedQuery);
      const tokenScore = queryTokens.reduce((total, token) => {
        if (entry.tokens.includes(token)) return total + 18;
        if (entry.tokens.some((entryToken) => entryToken.includes(token) || token.includes(entryToken))) return total + 11;
        const closest = Math.max(...entry.tokens.map((entryToken) => similarityScore(token, entryToken)), 0);
        return total + closest * 10;
      }, 0);
      const titleBoost = normaliseSearchText(entry.title).includes(normalisedQuery) ? 30 : 0;
      const score = (exactPhrase ? 80 : 0) + titleBoost + tokenScore / queryTokens.length;
      return { ...entry, score, isExact: exactPhrase || titleBoost > 0 };
    })
    .filter((entry) => entry.score >= 6)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}

function questionSearchIndex() {
  return pastPaperQuestionBank.map((hit, index) => {
    const section = syllabusSectionByCode(hit.section);
    const sectionTitle = section ? `${section.code} ${section.title}` : hit.section;
    const chapter = syllabusChapterForSection(hit.section);
    const chapterTitle = chapter ? `${chapter.chapter}. ${chapter.title}` : "";
    const topic = topicForQuestion(hit, section, chapter);
    const source = hit.ref ? `${hit.paper} ${hit.ref}` : hit.paper;
    const searchBody = [
      hit.knowledge,
      hit.question,
      hit.answer,
      sectionTitle,
      chapterTitle,
      topic.keywords.join(" ")
    ].join(" ");

    return {
      ...hit,
      syllabusId: hit.syllabusId || "caie-igcse-0478",
      id: questionId(hit, index),
      index,
      source,
      sectionTitle,
      chapterTitle,
      paperLabel: hit.paper,
      qpTarget: paperChipIdFromPaper(hit.paper, "qp"),
      msTarget: paperChipIdFromPaper(hit.paper, "ms"),
      topicSummary: topic.summary,
      tags: topic.keywords,
      searchText: normaliseSearchText(searchBody),
      tokens: searchTokens(searchBody)
    };
  });
}

async function renderQuestionFinderResults(query) {
  const resultsContainer = $("questionFinderResults");
  const status = $("questionFinderStatus");
  if (!resultsContainer || !status) return [];

  const trimmed = query.trim();
  if (!trimmed) {
    state.questionMatches = [];
    status.textContent = "Choose a syllabus and enter a knowledge point.";
    resultsContainer.innerHTML = `<p class="question-empty-state">Try a precise topic such as lossless compression, or a broader chapter phrase such as data storage.</p>`;
    updateQuestionSelectionUi();
    return [];
  }

  const syllabusIds = selectedQuestionSyllabusIds();
  if (!syllabusIds.length) {
    status.textContent = "Select at least one syllabus.";
    return [];
  }

  let payload;
  try {
    payload = await findQuestionMatchesFromApi(trimmed, syllabusIds);
  } catch (error) {
    status.textContent = error.message || "Could not search the question bank.";
    await loadQuestionFinderAccess();
    return [];
  }

  const matches = payload.matches || [];
  if (payload.access) renderQuestionFinderAccess(payload.access);
  state.questionMatches = matches;
  const exactCount = matches.filter((match) => match.isExact).length;
  status.textContent = matches.length
    ? `${matches.length} matching question${matches.length === 1 ? "" : "s"} found${exactCount ? `, ${exactCount} exact` : ""}.`
    : "No related exam questions found.";

  resultsContainer.innerHTML = matches.length
    ? matches.map(questionResultMarkup).join("")
    : `<p class="question-empty-state">No question in the indexed bank matches this term yet. Try a broader phrase, or add tags to the question bank for this knowledge point.</p>`;

  resultsContainer.querySelectorAll("[data-question-select]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const id = checkbox.dataset.questionSelect;
      if (checkbox.checked) state.selectedQuestionIds.add(id);
      else state.selectedQuestionIds.delete(id);
      updateQuestionSelectionUi();
    });
  });

  updateQuestionSelectionUi();
  return matches;
}

async function findQuestionMatchesFromApi(query, syllabusIds) {
  if (!window.location.protocol.startsWith("http")) throw new Error("Question Finder requires the PaperLens server.");
  const response = await fetch("/api/question-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      syllabusIds
    })
  });
  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload.error || "Question search failed.");
    error.status = response.status;
    throw error;
  }
  return payload;
}

function selectedQuestionSyllabusIds() {
  return [...document.querySelectorAll(".question-syllabus-input:checked")].map((input) => input.value);
}

async function loadQuestionFinderAccess() {
  if (!window.location.protocol.startsWith("http")) return;
  try {
    const response = await fetch("/api/question-finder/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    if (!response.ok) return;
    renderQuestionFinderAccess(await response.json());
  } catch {}
}

function renderQuestionFinderAccess(access) {
  state.questionAccess = access;
  const bar = $("questionFinderAccessBar");
  const title = $("questionFinderAccessTitle");
  const detail = $("questionFinderAccessDetail");
  const loginLink = $("questionFinderLoginLink");
  const buyButton = $("questionFinderBuyButton");
  const section = $("question-finder");
  const searchButton = $("questionFinderSubmit");
  const searchLocked = !access.canSearch;

  bar?.classList.toggle("has-full-access", Boolean(access.purchased));
  bar?.classList.toggle("is-exhausted", Boolean(access.loggedIn && !access.purchased && access.remaining === 0));
  section?.classList.toggle("is-search-locked", searchLocked);

  if (!access.loggedIn) {
    if (title) title.textContent = "Sign in to start";
    if (detail) detail.textContent = "Two successful searches are included before purchase.";
  } else if (access.purchased) {
    if (title) title.textContent = "Full Question Finder access";
    if (detail) detail.textContent = "Unlimited syllabus searches and original-format PDFs.";
  } else if (access.remaining > 0) {
    if (title) title.textContent = `${access.remaining} free search${access.remaining === 1 ? "" : "es"} remaining`;
    if (detail) detail.textContent = "A search is counted only when at least one question is shown.";
  } else {
    if (title) title.textContent = "Free searches complete";
    if (detail) detail.textContent = "Buy access to continue searching and building question sets.";
  }

  if (loginLink) loginLink.hidden = Boolean(access.loggedIn);
  if (buyButton) buyButton.hidden = Boolean(access.purchased);
  if (searchButton) searchButton.disabled = searchLocked;
  document.querySelectorAll("[data-question-suggestion]").forEach((button) => {
    button.disabled = searchLocked;
  });
}

function findQuestionMatches(query) {
  const normalisedQuery = normaliseSearchText(query);
  const queryTokens = searchTokens(query);
  if (!normalisedQuery || !queryTokens.length) return [];

  return questionSearchIndex()
    .map((entry) => {
      const exactPhrase = entry.searchText.includes(normalisedQuery);
      const tokenScore = queryTokens.reduce((total, token) => {
        if (entry.tokens.includes(token)) return total + 22;
        if (entry.tokens.some((entryToken) => entryToken.includes(token) || token.includes(entryToken))) return total + 13;
        const closest = Math.max(...entry.tokens.map((entryToken) => similarityScore(token, entryToken)), 0);
        return total + closest * 11;
      }, 0);
      const titleText = normaliseSearchText(`${entry.knowledge} ${entry.sectionTitle} ${entry.chapterTitle}`);
      const titleBoost = titleText.includes(normalisedQuery) ? 34 : 0;
      const score = (exactPhrase ? 84 : 0) + titleBoost + tokenScore / queryTokens.length;
      return { ...entry, score: Math.round(score), isExact: exactPhrase || titleBoost > 0 };
    })
    .filter((entry) => entry.score >= 20)
    .sort((a, b) => b.score - a.score || b.paper.localeCompare(a.paper))
    .slice(0, 30);
}

function questionResultMarkup(match) {
  const checked = state.selectedQuestionIds.has(match.id) ? "checked" : "";
  const selectedClass = checked ? " is-selected" : "";
  const questionUrl = questionPreviewUrl(match.id, "qp");
  const answerUrl = questionPreviewUrl(match.id, "ms");
  const questionAlt = `Original past-paper question ${match.source}`;
  const answerAlt = `Original mark scheme answer ${match.source}`;
  return `
    <article class="question-result-card${selectedClass}" data-question-card="${match.id}">
      <div class="question-card-head">
        <input type="checkbox" aria-label="Select ${escapeHtml(match.source)}" data-question-select="${match.id}" ${checked} />
        <div class="question-card-title">
          <strong>${highlightSearchTerm(escapeHtml(match.knowledge), $("questionFinderInput")?.value || "")}</strong>
          <div class="question-meta-row">
            <span>${escapeHtml(match.source)}</span>
            <span>Syllabus: ${escapeHtml(match.sectionTitle)}</span>
          </div>
        </div>
      </div>
      <button
        class="question-preview-button"
        type="button"
        aria-label="Open ${escapeHtml(questionAlt)}"
        data-question-preview-url="${escapeHtml(questionUrl)}"
        data-question-preview-alt="${escapeHtml(questionAlt)}"
      >
        <img
          class="original-question-preview"
          src="${escapeHtml(questionUrl)}"
          alt="${escapeHtml(questionAlt)}"
          loading="lazy"
        />
      </button>
      <details class="question-answer-preview">
        <summary>View mark scheme answer</summary>
        <button
          class="question-preview-button question-answer-image-button"
          type="button"
          aria-label="Open ${escapeHtml(answerAlt)}"
          data-question-preview-url="${escapeHtml(answerUrl)}"
          data-question-preview-alt="${escapeHtml(answerAlt)}"
        >
          <img
            class="original-question-preview"
            src="${escapeHtml(answerUrl)}"
            alt="${escapeHtml(answerAlt)}"
            loading="lazy"
          />
        </button>
      </details>
    </article>
  `;
}

function questionPreviewUrl(questionId, type = "qp") {
  const params = new URLSearchParams({
    id: questionId,
    type
  });
  return `/api/question-preview?${params.toString()}`;
}

function handleQuestionPreviewClick(event) {
  const button = event.target.closest("[data-question-preview-url]");
  if (!button) return;
  const modal = $("questionImageModal");
  const image = $("questionImageModalImage");
  if (!modal || !image) return;
  image.src = button.dataset.questionPreviewUrl;
  image.alt = button.dataset.questionPreviewAlt || "Original paper preview";
  modal.hidden = false;
  document.body.classList.add("question-image-modal-open");
  $("questionImageCloseButton")?.focus();
}

function closeQuestionImageModal() {
  const modal = $("questionImageModal");
  const image = $("questionImageModalImage");
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  if (image) image.removeAttribute("src");
  document.body.classList.remove("question-image-modal-open");
}

function updateQuestionSelectionUi() {
  const count = state.selectedQuestionIds.size;
  const countNode = $("questionSelectionCount");
  const downloadButton = $("downloadQuestionPdf");
  if (countNode) countNode.textContent = `${count} selected`;
  if (downloadButton) {
    downloadButton.disabled = count === 0;
    downloadButton.textContent = count ? `Generate original PDF (${count})` : "Generate original PDF";
    downloadButton.title = count ? "Download the selected questions as original past-paper PDF pages." : "Select at least one question first.";
  }
  document.querySelectorAll("[data-question-card]").forEach((card) => {
    card.classList.toggle("is-selected", state.selectedQuestionIds.has(card.dataset.questionCard));
  });
}

function clearQuestionSelection() {
  state.selectedQuestionIds.clear();
  document.querySelectorAll("[data-question-select]").forEach((checkbox) => {
    checkbox.checked = false;
  });
  updateQuestionSelectionUi();
}

async function downloadSelectedQuestionPdf() {
  const selectedIds = [...state.selectedQuestionIds];
  if (!selectedIds.length) return;

  const button = $("downloadQuestionPdf");
  const originalText = button?.textContent || "Generate PDF";
  if (button) {
    button.disabled = true;
    button.textContent = "Generating...";
  }

  try {
    const response = await fetch("/api/question-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionIds: selectedIds,
        query: $("questionFinderInput")?.value || "custom practice",
        includeMarkScheme: Boolean($("includeMarkScheme")?.checked),
        syllabusIds: selectedQuestionSyllabusIds()
      })
    });
    if (!response.ok) {
      let message = "PDF generation failed";
      try {
        const payload = await response.json();
        message = payload.error || payload.detail || message;
      } catch {}
      throw new Error(message);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filenameForQuestionPdf($("questionFinderInput")?.value || "paperlens-questions");
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    const status = $("questionFinderStatus");
    if (status) status.textContent = error.message || "Could not generate the PDF from the original papers. Please check the selected question sources.";
  } finally {
    if (button) {
      button.disabled = state.selectedQuestionIds.size === 0;
      button.textContent = originalText.startsWith("Generating") ? `Generate PDF (${state.selectedQuestionIds.size})` : originalText;
      updateQuestionSelectionUi();
    }
  }
}

function filenameForQuestionPdf(query) {
  const slug = slugPart(query || "custom-practice") || "custom-practice";
  return `paperlens-${slug}-questions.pdf`;
}

function questionId(hit, index) {
  return `${hit.paper}-${hit.ref || index}-${hit.section}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function syllabusSectionByCode(code) {
  for (const chapters of Object.values(syllabusChecklist)) {
    for (const chapter of chapters) {
      const section = chapter.sections.find((candidate) => candidate.code === code);
      if (section) return section;
    }
  }
  return null;
}

function syllabusChapterForSection(code) {
  for (const chapters of Object.values(syllabusChecklist)) {
    for (const chapter of chapters) {
      if (chapter.sections.some((section) => section.code === code)) return chapter;
    }
  }
  return null;
}

function topicForQuestion(hit, section, chapter) {
  const text = `${hit.knowledge} ${hit.question} ${hit.answer} ${section?.title || ""} ${chapter?.title || ""}`;
  return {
    summary: section ? `${section.code} ${section.title}` : hit.section,
    keywords: extractSearchTerms(text)
  };
}

function locateKnowledgePoint(match, query = "") {
  const target = document.getElementById(match.targetId);
  if (!target) return;

  const parentDetails = target.closest("details");
  if (parentDetails) parentDetails.open = true;

  clearLocatedSearchHighlights();
  highlightLocatedSearchTerms(target, query, match);

  target.classList.remove("search-target");
  window.requestAnimationFrame(() => {
    target.classList.add("search-target");
    target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  });

  if (window.history.replaceState) {
    window.history.replaceState(null, "", `#${match.targetId}`);
  }
}

function clearLocatedSearchHighlights() {
  document.querySelectorAll("mark.located-search-mark").forEach((mark) => {
    const textNode = document.createTextNode(mark.textContent);
    mark.replaceWith(textNode);
    textNode.parentElement?.normalize();
  });
}

function highlightLocatedSearchTerms(target, query, match) {
  const tokens = highlightTokensForMatch(query, match);
  if (!tokens.length) return;

  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join("|")})`, "gi");
  const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest("script, style, mark, a, button")) return NodeFilter.FILTER_REJECT;
      pattern.lastIndex = 0;
      return pattern.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    pattern.lastIndex = 0;
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    node.nodeValue.replace(pattern, (matchText, _term, offset) => {
      if (offset > cursor) fragment.append(document.createTextNode(node.nodeValue.slice(cursor, offset)));
      const mark = document.createElement("mark");
      mark.className = "located-search-mark";
      mark.textContent = matchText;
      fragment.append(mark);
      cursor = offset + matchText.length;
      return matchText;
    });
    if (cursor < node.nodeValue.length) fragment.append(document.createTextNode(node.nodeValue.slice(cursor)));
    node.replaceWith(fragment);
  });
}

function highlightTokensForMatch(query, match) {
  const queryTokens = searchTokens(query);
  const exactTokens = queryTokens.filter((token) => match.tokens.includes(token));
  const fuzzyTokens = queryTokens.flatMap((token) =>
    match.tokens
      .filter((entryToken) => entryToken.length > 2 && (entryToken.includes(token) || token.includes(entryToken) || similarityScore(token, entryToken) >= 0.72))
      .sort((a, b) => similarityScore(token, b) - similarityScore(token, a))
      .slice(0, 2)
  );

  return [...new Set([...exactTokens, ...fuzzyTokens])]
    .filter((token) => token.length > 1)
    .sort((a, b) => b.length - a.length)
    .slice(0, 8);
}

function normaliseSearchText(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function searchTokens(value) {
  return normaliseSearchText(value)
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function similarityScore(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const distance = levenshteinDistance(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

function levenshteinDistance(a, b) {
  const rows = Array.from({ length: a.length + 1 }, (_, index) => [index]);
  for (let column = 1; column <= b.length; column += 1) rows[0][column] = column;

  for (let row = 1; row <= a.length; row += 1) {
    for (let column = 1; column <= b.length; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + cost
      );
    }
  }

  return rows[a.length][b.length];
}

function highlightSearchTerm(text, query) {
  return searchTokens(query).reduce((output, token) => {
    const pattern = new RegExp(`(${escapeRegExp(token)})`, "gi");
    return output.replace(pattern, "<mark>$1</mark>");
  }, text);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function highlightKeywords(text) {
  const terms = [
    "binary",
    "logic circuits",
    "registers",
    "base 10",
    "base 2",
    "base 16",
    "hexadecimal",
    "four binary bits",
    "overflow",
    "255",
    "left shifts",
    "right shifts",
    "two's complement",
    "-128",
    "+127",
    "ASCII",
    "Unicode",
    "sample rate",
    "sample resolution",
    "resolution",
    "colour depth",
    "1024",
    "RLE",
    "lossless",
    "lossy",
    "header",
    "payload",
    "trailer",
    "packet switching",
    "parity",
    "checksum",
    "echo check",
    "check digit",
    "ARQ",
    "public and private keys",
    "ALU",
    "CU",
    "registers",
    "fetch",
    "decode",
    "execute",
    "RAM",
    "ROM",
    "virtual memory",
    "MAC address",
    "IP address",
    "router",
    "operating system",
    "interrupts",
    "compiler",
    "interpreter",
    "IDE",
    "HTTP",
    "HTTPS",
    "cookies",
    "blockchain",
    "malware",
    "phishing",
    "firewalls",
    "encryption",
    "sensors",
    "microprocessor",
    "actuators",
    "expert systems",
    "machine learning",
    "training data",
    "knowledge base",
    "inference engine",
    "decomposition",
    "abstraction",
    "linear search",
    "bubble sort",
    "assignment",
    "validation",
    "verification",
    "normal",
    "abnormal",
    "boundary",
    "trace tables",
    "pseudocode",
    "arrays",
    "constants",
    "operators",
    "string handling",
    "local variables",
    "global variables",
    "parameters",
    "maintainability",
    "primary key",
    "field names",
    "range check",
    "type check",
    "length check",
    "presence check",
    "format check",
    "lookup check",
    "ascending",
    "descending",
    "forms",
    "reports",
    "embedded systems",
    "opcode",
    "operand",
    "ADC",
    "DAC",
    "monitoring",
    "control systems",
    "utility software",
    "assembler",
    "buffer",
    "SSL",
    "TLS",
    "pharming",
    "social engineering",
    "proxy servers",
    "botnets",
    "DDoS",
    "malware",
    "ransomware",
    "brute-force",
    "data interception",
    "bubble sort",
    "SUM",
    "COUNT",
    "SELECT",
    "FROM",
    "WHERE",
    "truth tables",
    "logic circuits"
  ].sort((a, b) => b.length - a.length);
  return terms.reduce((output, term) => {
    const pattern = new RegExp(`\\b(${escapeRegExp(term)})\\b`, "gi");
    return output.replace(pattern, "<mark>$1</mark>");
  }, text);
}

function sectionVisual(section) {
  const visuals = {
    "1.1": `
      ${tableBlock(["Number system", "Base", "Digits used", "Use"], [
        ["Denary", "10", "0-9", "normal human number system"],
        ["Binary", "2", "0 and 1", "used by computers"],
        ["Hexadecimal", "16", "0-9 and A-F", "shorter representation of binary"]
      ], "number-system-table")}
      <div class="worked-example">
        <h5>Worked example: binary to denary</h5>
        <div class="place-value-example">
          <p><strong>Binary:</strong> 10110110</p>
          <table>
            <tr><th>128</th><th>64</th><th>32</th><th>16</th><th>8</th><th>4</th><th>2</th><th>1</th></tr>
            <tr><td>1</td><td>0</td><td>1</td><td>1</td><td>0</td><td>1</td><td>1</td><td>0</td></tr>
          </table>
          <p>= 128 + 32 + 16 + 4 + 2</p>
          <p>= <strong>182</strong></p>
        </div>
      </div>
    `,
    "1.2": tableBlock(["Representation", "Exam focus", "Mark-scheme keywords"], [
      ["Text", "ASCII vs Unicode", "<strong>more characters</strong>, <strong>languages</strong>, <strong>more bits</strong>"],
      ["Sound", "Sampling and quality", "<strong>sample rate</strong>, <strong>sample resolution</strong>, <strong>larger file size</strong>"],
      ["Image", "Quality and file size", "<strong>pixels</strong>, <strong>resolution</strong>, <strong>colour depth</strong>"]
    ]),
    "1.3": `
      <div class="formula-grid">
        <div><strong>Image bits</strong><span>width x height x colour depth</span></div>
        <div><strong>Sound bits</strong><span>sample rate x sample resolution x duration x channels</span></div>
        <div><strong>Unit conversion</strong><span>1 byte = 8 bits; 1 KiB = 1024 bytes; 1 MiB = 1024 KiB</span></div>
      </div>
      ${tableBlock(["Compression", "Can original be restored?", "Best for"], [
        ["Lossless", "<strong>Yes</strong>", "text, code, medical/important images, RLE"],
        ["Lossy", "<strong>No</strong>", "photos, audio, video where quality loss is acceptable"]
      ])}
    `,
    "2.1": flowBlock([
      ["Data split into packets", "Large data is divided so each packet can be sent, routed and resent if needed."],
      ["Routers choose routes", "Each packet is forwarded across the network using address information in the packet header."],
      ["Packets may arrive out of order", "Different routes can take different times, so packet numbers are needed."],
      ["Receiver reorders packets", "The destination uses packet numbers to rebuild the original data."]
    ]),
    "2.2": tableBlock(["Method", "What to remember"], [
      ["Parity", "odd/even parity bit checks changed bits"],
      ["Checksum", "calculated value is compared after transmission"],
      ["Echo check", "receiver sends data back for comparison"],
      ["ARQ", "uses acknowledgement, timeout and retransmission"]
    ]),
    "2.3": tableBlock(["Encryption type", "Key idea", "Exam contrast"], [
      ["Symmetric", "same key encrypts and decrypts", "fast but key sharing is a risk"],
      ["Asymmetric", "public/private key pair", "safer key exchange but more complex"]
    ]),
    "3.1": flowBlock([
      ["PC", "Holds the address of the next instruction."],
      ["MAR", "Sends the address to memory."],
      ["MDR", "Stores data or instructions moving to/from memory."],
      ["CIR", "Stores the current instruction."],
      ["CU", "Decodes and controls execution."],
      ["ALU/ACC", "Carries out calculations and stores results."]
    ]),
    "3.2": tableBlock(["Scenario", "Likely device", "Reason"], [
      ["Scan product", "barcode / QR scanner", "fast machine-readable input"],
      ["Measure environment", "sensor", "captures physical data"],
      ["Create physical model", "3D printer", "produces solid output"]
    ]),
    "3.3": tableBlock(["Storage", "Key mechanism", "Typical examples"], [
      ["Magnetic", "platters, tracks, sectors, electromagnets", "HDD"],
      ["Optical", "laser reads pits and lands", "CD, DVD, Blu-ray"],
      ["Solid-state", "NAND/NOR flash memory", "SSD, SD card, USB drive"]
    ]),
    "3.4": tableBlock(["Address", "Purpose", "Common mark point"], [
      ["MAC", "hardware/network interface identity", "usually hexadecimal; manufacturer + serial code"],
      ["IP", "network location/address", "static or dynamic; IPv4 vs IPv6"]
    ]),
    "4.1": tableBlock(["Software", "Purpose", "Examples"], [
      ["System software", "runs and manages the computer", "OS, utilities"],
      ["Application software", "helps user complete tasks", "browser, editor, spreadsheet"]
    ]),
    "4.2": tableBlock(["Translator", "How it works", "Useful point"], [
      ["Compiler", "translates whole program before running", "produces executable, errors after compilation"],
      ["Interpreter", "translates/runs line by line", "easier debugging, slower execution"]
    ]),
    "5.1": flowBlock([
      ["Browser requests URL", "The client asks for a web resource."],
      ["DNS finds server address", "Domain name is translated to an IP address."],
      ["HTTP/HTTPS request sent", "HTTPS encrypts the request and response."],
      ["Server returns files", "HTML, CSS, scripts and media are sent back."],
      ["Browser renders page", "The page is interpreted and displayed."]
    ]),
    "5.2": flowBlock([
      ["Transaction requested", "A digital transaction is created."],
      ["Grouped into block", "Transactions are collected together."],
      ["Network validates", "Participants check that the transaction is valid."],
      ["Block linked", "The block is added to the previous block."],
      ["Ledger updated", "Copies of the blockchain record are updated."]
    ]),
    "5.3": tableBlock(["Threat", "Protection", "Keyword"], [
      ["Phishing", "user education, filtering, 2FA", "deception"],
      ["Malware", "anti-malware and updates", "infection"],
      ["Unauthorised access", "passwords, access rights, firewall", "authentication"]
    ]),
    "6.1": flowBlock([
      ["Sensor reads data", "Physical values such as temperature or light are captured."],
      ["Microprocessor compares", "The reading is checked against stored values."],
      ["Decision made", "The system chooses whether action is needed."],
      ["Actuator changes output", "A device such as a motor, heater or valve is controlled."]
    ]),
    "6.2": tableBlock(["Robot use", "Why suitable"], [
      ["Manufacturing", "repetitive and precise"],
      ["Hazardous environments", "reduces human risk"],
      ["Surgery", "precision and control"]
    ]),
    "6.3": flowBlock([
      ["User answers questions", "Facts are collected from the user."],
      ["Inference engine applies rules", "Rules are used to reason from the facts."],
      ["Knowledge base searched", "Stored expert knowledge is checked."],
      ["System outputs advice", "A recommendation or diagnosis is given."]
    ]),
    "7.1": flowBlock([
      ["Analyse problem", "Identify inputs, outputs and required processing."],
      ["Decompose", "Break the problem into smaller parts."],
      ["Design algorithm", "Plan the logic using pseudocode or a flowchart."],
      ["Code solution", "Implement the algorithm."],
      ["Test and maintain", "Check with test data and improve if needed."]
    ]),
    "7.2": tableBlock(["Test data", "Expected purpose"], [
      ["Normal", "accepted by the system"],
      ["Abnormal", "rejected by the system"],
      ["Boundary/extreme", "tests limits of valid ranges"]
    ]),
    "7.3": tableBlock(["Error type", "Meaning"], [
      ["Syntax", "breaks language rules"],
      ["Logic", "runs but gives wrong result"],
      ["Runtime", "fails while executing"]
    ]),
    "8.1": `
      <div class="worked-example">
        <h5>Pseudocode pattern</h5>
        <pre>FOR Index <- 1 TO 10
   IF Scores[Index] >= 50 THEN
      PassCount <- PassCount + 1
   ENDIF
NEXT Index</pre>
      </div>
    `,
    "8.2": tableBlock(["Array", "Use"], [
      ["1D", "list of values, one index"],
      ["2D", "table/grid, row and column index"],
      ["Loop", "read, write, search or total values"]
    ]),
    "8.3": flowBlock([
      ["OPENFILE", "Open the file in the correct mode."],
      ["READFILE / WRITEFILE", "Read existing data or write new data."],
      ["Process data", "Use the data in the program."],
      ["CLOSEFILE", "Close the file after use."]
    ]),
    "9": `
      ${tableBlock(["Area", "What to remember", "Exam trap"], [
        ["Structure", "database, table, record, field, field name and data type", "record = row; field = column"],
        ["Field design", "names should be meaningful, unique, short and clear, e.g. StudentID or OrderDate", "avoid vague names such as thing or date"],
        ["Primary key", "a unique field such as StudentID, BookID or Code", "not just the most important-looking data"],
        ["Validation", "range, type, length, presence, format or lookup check", "validation does not prove data is true"]
      ])}
      ${tableBlock(["Field example", "Suitable data type", "Possible validation"], [
        ["StudentID", "string or integer", "length / presence check"],
        ["Mark", "integer", "range check such as 0 to 100"],
        ["DateOfBirth", "date", "format check"],
        ["Email", "string", "format / presence check"],
        ["Member", "Boolean", "true or false"]
      ])}
      ${tableBlock(["Database tool", "Purpose"], [
        ["Search/query", "find records that match criteria"],
        ["Sort ascending", "A-Z, smallest to largest or oldest to newest"],
        ["Sort descending", "Z-A, largest to smallest or newest to oldest"],
        ["Form", "make data entry or editing easier, often using controls such as drop-down lists"],
        ["Report", "present selected data clearly for viewing or printing"]
      ])}
      ${tableBlock(["SQL keyword", "Meaning"], [
        ["SELECT", "choose fields to display"],
        ["FROM", "choose the table"],
        ["WHERE", "filter records using criteria"],
        ["ORDER BY", "sort the results"],
        ["ASC / DESC", "ascending / descending order"],
        ["SUM / COUNT", "total values / count matching records"]
      ])}
      ${tableBlock(["Common mistake", "Better exam habit"], [
        ["Confusing record and field", "state row/record and column/field explicitly"],
        ["Choosing a non-unique primary key", "justify uniqueness"],
        ["Using = > instead of >=", "write comparison operators carefully"],
        ["Selecting every field", "only select fields requested by the question"],
        ["Assuming validation proves truth", "say it checks whether data is reasonable or allowed"]
      ])}
      <div class="worked-example">
        <h5>SQL pattern</h5>
        <pre>SELECT Name, Score
FROM Results
WHERE Score >= 50
ORDER BY Score DESCENDING</pre>
      </div>
    `,
    "10": tableBlock(["Gate", "Output is 1 when..."], [
      ["AND", "both inputs are 1"],
      ["OR", "at least one input is 1"],
      ["NOT", "input is 0"],
      ["XOR/EOR", "inputs are different"],
      ["NAND/NOR", "inverse of AND / OR"]
    ])
  };
  return visuals[section.code] || "";
}

function tableBlock(headers, rows, extraClass = "") {
  return `<div class="knowledge-table-wrap ${extraClass}"><table class="knowledge-table">
    <thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
}

function flowBlock(steps) {
  return `
    <ol class="flow-strip">
      ${steps
        .map((step, index) => {
          const [title, detail] = Array.isArray(step) ? step : [step, ""];
          return `
          <li class="flow-step">
            <strong>${title}</strong>
            ${detail ? `<p>${detail}</p>` : ""}
          </li>
        `;
        })
        .join("")}
    </ol>
  `;
}

function probabilityBadge(stats) {
  return `<span class="exam-probability" title="Weighted by syllabus coverage, textbook alignment, and 2019-2025 past-paper trend signals; newer papers carry more weight.">
    Exam probability ${stats.probability}% · ${stats.signals} signals
  </span>`;
}

function probabilityForChapter(chapter) {
  const sectionStats = chapter.sections.map(probabilityForSection);
  const avg = sectionStats.reduce((sum, item) => sum + item.probability, 0) / sectionStats.length;
  const maxSignals = sectionStats.reduce((sum, item) => sum + item.signals, 0);
  const boosted = Math.min(96, Math.round(avg + Math.min(8, chapter.sections.length)));
  return { probability: boosted, signals: Math.round(maxSignals) };
}

function probabilityForSection(section) {
  const text = `${section.code} ${section.title} ${section.items.join(" ")}`;
  const terms = probabilityTerms(text);
  const signals = sourceLibrary.reduce((total, source) => {
    const weight = pastPaperTrendWeight(source);
    return total + terms.reduce((sum, term) => sum + countTermHits(source.text, term) * weight, 0);
  }, 0);
  const syllabusAnchor = section.items.length * 3;
  const probability = Math.max(38, Math.min(95, Math.round(42 + Math.log2(signals + syllabusAnchor + 1) * 10)));
  return { probability, signals: Math.round(signals + syllabusAnchor) };
}

function pastPaperTrendWeight(source) {
  if (source.name.includes("2023-2025")) return 2.4;
  if (source.name.includes("2019-2022")) return 1.15;
  if (source.name.includes("Mark-scheme")) return 1.25;
  if (source.name.includes("Chapter")) return 0.95;
  return 0.35;
}

function probabilityTerms(text) {
  const phrases = [
    "binary",
    "hexadecimal",
    "overflow",
    "logical shift",
    "two's complement",
    "ascii",
    "unicode",
    "sample rate",
    "sample resolution",
    "colour depth",
    "file size",
    "compression",
    "lossless",
    "lossy",
    "packet",
    "encryption",
    "cpu",
    "fetch decode execute",
    "ram",
    "rom",
    "router",
    "operating system",
    "compiler",
    "interpreter",
    "ide",
    "cookie",
    "cyber security",
    "algorithm",
    "trace table",
    "validation",
    "test data",
    "array",
    "file handling",
    "database",
    "sql",
    "logic gate",
    "truth table"
  ];
  const lower = text.toLowerCase();
  const words = lower.match(/\b[a-z][a-z'-]{4,}\b/g) || [];
  const selectedWords = [...new Set(words.filter((word) => !["explain", "describe", "understand", "compare", "suitable", "given", "using", "including"].includes(word)))];
  return [...new Set([...phrases.filter((phrase) => lower.includes(phrase)), ...selectedWords.slice(0, 18)])];
}

function countTermHits(text, term) {
  const pattern = term.includes(" ")
    ? escapeRegExp(term).replaceAll("\\ ", "\\s+")
    : `\\b${escapeRegExp(term)}\\b`;
  const matches = text.toLowerCase().match(new RegExp(pattern, "g"));
  return matches ? matches.length : 0;
}

function renderPastPaperArchive(containerId) {
  const container = $(containerId);
  if (!container) return;

  container.innerHTML = pastPaperCatalogMarkup();
}

function renderPastPaperCatalog(containerId, paperPrefix) {
  const container = $(containerId);
  if (!container) return;

  container.innerHTML = pastPaperCatalogMarkup(paperPrefix);
}

function pastPaperCatalogMarkup(paperPrefix = "") {

  const latestYear = Math.max(...paperSessions.map((session) => session.year));
  const recentCutoff = latestYear - 1;
  const sessions = paperPrefix
    ? paperSessions.filter((session) => session.components.some((component) => component.startsWith(paperPrefix)))
    : paperSessions;
  const recentSessions = sessions.filter((session) => session.year >= recentCutoff);
  const olderSessions = sessions.filter((session) => session.year < recentCutoff);

  return `
    <div class="catalog-recent">
      ${recentSessions.map((session, index) => catalogSessionMarkup(session, paperPrefix, !hasFullAccess() && index >= previewRecentPaperSessions)).join("")}
    </div>
    <details class="older-catalog ${hasFullAccess() ? "" : "is-locked"}" data-access-locked="${!hasFullAccess()}">
      <summary>Show older papers (${olderSessions.length} sessions)</summary>
      <div class="older-catalog-list">
        ${olderSessions.map((session) => catalogSessionMarkup(session, paperPrefix, !hasFullAccess())).join("")}
      </div>
      ${hasFullAccess() ? "" : lockedOverlay("Buy lifetime access to download the full historical paper archive.")}
    </details>
  `;
}

function catalogSessionMarkup(session, paperPrefix = "", locked = false) {
  const components = paperPrefix
    ? session.components.filter((component) => component.startsWith(paperPrefix))
    : session.components;
  const questionPapers = components.map((component) => catalogChipMarkup(session, "qp", component, `QP ${component}`));
  const markSchemes = components.map((component) => catalogChipMarkup(session, "ms", component, `MS ${component}`));
  const preReleaseComponents = components.filter((component) => component.startsWith("2"));
  const preRelease = session.legacy
    ? preReleaseComponents.map((component) => catalogChipMarkup(session, "pm", component, `PM ${component}`))
    : [];

  return `
    <details class="catalog-session ${locked ? "is-locked" : ""}" id="paper-session-${session.code}${String(session.year).slice(-2)}${paperPrefix ? `-${paperPrefix}` : ""}" data-access-locked="${locked}">
      <summary>${session.year} ${session.season}</summary>
      <div class="catalog-group">
        <span class="catalog-title">Question paper</span>
        <div class="catalog-chips">${questionPapers.join("")}</div>
      </div>
      <div class="catalog-group">
        <span class="catalog-title">Mark scheme</span>
        <div class="catalog-chips">${markSchemes.join("")}</div>
      </div>
      ${
        preRelease.length
          ? `<div class="catalog-group">
              <span class="catalog-title">Pre-release material</span>
              <div class="catalog-chips">${preRelease.join("")}</div>
            </div>`
          : ""
      }
      ${locked ? lockedOverlay("This session is included in the lifetime-access archive.") : ""}
    </details>
  `;
}

function catalogChipMarkup(session, type, component, label) {
  const paper = `0478/${component}/${session.code === "m" ? "F/M" : session.code === "s" ? "M/J" : "O/N"}/${String(session.year).slice(-2)}`;
  const filename = localPaperFilename(session, type, component);
  if (!hasLocalPaperFile(session, type, component)) {
    return `<span id="${paperChipIdFromPaper(paper, type)}" class="catalog-chip is-missing" title="PDF file is not in textbook_syllabus/pastpaper">${label}</span>`;
  }

  return `<a id="${paperChipIdFromPaper(paper, type)}" class="catalog-chip" href="${paperPdfUrl(session, type, component)}" download="${filename}">${label}</a>`;
}

function handlePaperSourceClick(event) {
  const sourceTag = event.target.closest(".paper-source-tag");
  if (!sourceTag) return;

  const paper = sourceTag.dataset.paper;
  const targetId = paper ? paperChipIdFromPaper(paper, "qp") : "";
  const target = targetId ? document.getElementById(targetId) : null;
  if (!target) return;

  event.preventDefault();
  const olderCatalog = target.closest(".older-catalog");
  if (olderCatalog) olderCatalog.open = true;

  const session = target.closest(".catalog-session");
  if (session) session.open = true;

  document.querySelectorAll(".catalog-chip.is-targeted").forEach((chip) => chip.classList.remove("is-targeted"));
  target.classList.add("is-targeted");
  target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  window.history.replaceState(null, "", `#${targetId}`);
}

function renderChapterOne() {
  const board = $("chapterOneBoard");
  if (!board) return;

  board.innerHTML = chapterOneSections
    .map(
      (section) => `
      <details class="chapter-card" id="${chapterOneId(section.number)}" ${Number(section.number) <= 3 ? "open" : ""}>
        <summary>
          <span class="chapter-number">${section.number}</span>
          <span class="chapter-title">${section.title}</span>
          <span class="chapter-tag">${section.tag}</span>
        </summary>
        <p>${section.summary}</p>
        <ul>
          ${section.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}
        </ul>
        <div class="term-row">
          ${section.terms.map((term) => `<span>${term}</span>`).join("")}
        </div>
      </details>
    `
    )
    .join("");
}

function chapterOneId(number) {
  return `chapter-one-${slugPart(number)}`;
}

function setChapterDetails(open) {
  document.querySelectorAll(".chapter-card").forEach((card) => {
    card.open = open;
  });
}

function scoreTopic(topic, paperText, syllabusText, allText) {
  const paperHits = countHits(paperText, topic.keywords);
  const syllabusHits = countHits(syllabusText, topic.keywords);
  const totalHits = countHits(allText, topic.keywords);
  const coverage = totalHits === 0 ? 0 : Math.min(100, Math.round((syllabusHits / Math.max(1, paperHits + syllabusHits)) * 150));
  const recurrenceBoost = Math.min(34, paperHits * 4);
  const priority = Math.min(100, Math.round(totalHits * 7 + recurrenceBoost));
  const matched = topic.keywords.filter((keyword) => new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "i").test(allText));

  return {
    ...topic,
    paperHits,
    bookHits: syllabusHits,
    totalHits,
    coverage,
    priority,
    matched
  };
}

function buildChecklist(results) {
  const threshold = Number($("targetScore").value);
  return results
    .filter((topic) => topic.priority > 0)
    .slice(0, 12)
    .map((topic, index) => ({
      id: index + 1,
      topic: topic.name,
      priority: topic.priority,
      coverage: topic.coverage,
      status: topic.priority >= threshold ? "urgent" : topic.priority >= 45 ? "important" : "review",
      action: topic.focus,
      evidence: evidenceSentence(topic),
      keywords: topic.matched.slice(0, 7)
    }));
}

function renderSummary(totalSignals) {
  const top = state.results[0];
  const coverage = state.results.filter((item) => item.totalHits > 0);
  const avgCoverage = coverage.length
    ? Math.round(coverage.reduce((sum, item) => sum + item.coverage, 0) / coverage.length)
    : 0;
  $("docCount").textContent = state.docs.length;
  $("wordCount").textContent = totalSignals.toLocaleString();
  $("hotTopic").textContent = top && top.priority ? top.name.split(" ")[0] : "-";
  $("coverageScore").textContent = `${avgCoverage}%`;
}

function renderTopics() {
  $("topicList").innerHTML = state.results
    .filter((topic) => topic.totalHits > 0)
    .slice(0, 10)
    .map(
      (topic) => `
      <article class="topic-card">
        <div class="topic-title">
          <span>${topic.name}</span>
          <span>${topic.priority}%</span>
        </div>
        <div class="bar" aria-hidden="true"><span style="width:${topic.priority}%"></span></div>
        <p>${evidenceSentence(topic)}</p>
        <p><strong>Revision focus:</strong> ${topic.focus}</p>
      </article>
    `
    )
    .join("");
}

function renderChecklist() {
  $("checklistItems").innerHTML = state.checklist
    .map(
      (item) => `
      <li>
        <strong>${item.topic} <span aria-label="priority">(${item.status}, ${item.priority}%)</span></strong>
        <p>${item.action}</p>
        <p>${item.evidence}</p>
      </li>
    `
    )
    .join("");
}

function renderPractice(serverPrompts = null) {
  const prompts = serverPrompts || state.checklist.slice(0, 6).map((item) => practicePrompt(item));
  $("practicePrompts").innerHTML = prompts.length
    ? prompts.map((prompt) => `<div class="practice-item"><p>${prompt}</p></div>`).join("")
    : `<p>Run an analysis first, then generate practice prompts.</p>`;
}

function practicePrompt(item) {
  const command = {
    "Algorithms and problem solving": "Create a trace table for a loop-based algorithm, then explain the final output.",
    "Programming constructs": "Write pseudocode for a small validation routine using selection and iteration.",
    Databases: "Design a table with suitable fields and keys, then write one query that filters the records.",
    "Boolean logic": "Draw the truth table for a compound logic statement and simplify the output pattern.",
    Networks: "Compare two network setups for a school and justify the safer option.",
    "Cyber security": "Identify threats in a login scenario and recommend controls with reasons."
  }[item.topic];

  return command || `Write an exam-style answer that explains ${item.topic.toLowerCase()} in a practical scenario, using precise technical vocabulary.`;
}

function evidenceSentence(topic) {
  const words = topic.matched.length ? topic.matched.slice(0, 5).join(", ") : "no exact keywords";
  return `Found ${topic.paperHits} built-in paper signals and ${topic.bookHits} syllabus-era signals. Matched terms: ${words}.`;
}

function countHits(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.reduce((total, keyword) => {
    const matches = lower.match(new RegExp(`\\b${escapeRegExp(keyword.toLowerCase())}\\b`, "g"));
    return total + (matches ? matches.length : 0);
  }, 0);
}

function countWords(text) {
  return (text.trim().match(/\b[\w'-]+\b/g) || []).length;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function checklistMarkdown() {
  return [
    "# CAIE Computer Science Revision Checklist",
    "",
    ...state.checklist.map(
      (item) => `- [ ] **${item.topic}** (${item.status}, ${item.priority}%) - ${item.action} Evidence: ${item.evidence}`
    )
  ].join("\n");
}

function checklistCsv() {
  const rows = [["topic", "status", "priority", "coverage", "action", "evidence"]];
  state.checklist.forEach((item) => {
    rows.push([item.topic, item.status, item.priority, item.coverage, item.action, item.evidence]);
  });
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function download(filename, content, type) {
  if (!state.checklist.length) {
    analyzeMaterials();
  }
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

if ($("manualText") && $("paperFocus") && $("targetScore")) {
  analyzeMaterials();
}
