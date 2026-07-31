(function (root, factory) {
  const data = factory();
  if (typeof module === "object" && module.exports) module.exports = data;
  if (root) root.PaperLensData = data;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
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
    },
    {
      name: "AS & A Level 9618 Paper 1 syllabus signals",
      paper: "paper1",
      era: "9618-as",
      text: "information representation binary hexadecimal two's complement overflow ascii unicode bitmap vector graphics sound sampling sample rate sample resolution compression lossy lossless rle communication networks packet switching routing dns http https tcp ip mac address protocol hardware processor fundamentals cpu alu control unit registers buses fetch decode execute interrupt assembly language opcode operand addressing input output storage sensor actuator ram rom cache embedded system operating system scheduling memory management file management device driver utility software translator compiler interpreter assembler lexical syntax semantic data security encryption authentication firewall backup validation verification checksum parity privacy ethics ownership copyright computer misuse data protection database relational table entity attribute primary key foreign key referential integrity normalisation sql select from where order by join count sum avg"
    },
    {
      name: "AS & A Level 9618 Paper 2 syllabus signals",
      paper: "paper2",
      era: "9618-as",
      text: "algorithm design problem solving computational thinking decomposition abstraction structure chart flowchart pseudocode trace table dry run linear search binary search bubble sort insertion sort validation verification test data normal abnormal boundary syntax error logic error runtime error data type integer real char string boolean date record user defined type enumerated pointer array one dimensional two dimensional file handling open read write append close serial file stack queue linked list binary tree push pop enqueue dequeue pointer programming sequence selection iteration if case for while repeat procedure function parameter by value by reference local global variable modular design string handling substring length input output software development life cycle analysis design development testing maintenance ide debugger breakpoint watch window"
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

  const asLevel9618Checklist = {
    paper1: [
      {
        chapter: "1",
        title: "Information representation",
        sections: [
          {
            code: "9618-1.1",
            title: "Data representation",
            items: [
              "Number bases: convert positive and negative integers between denary, binary and hexadecimal, showing place-value or grouping working.",
              "Binary arithmetic: add binary values, recognise overflow, and use two's complement for signed integer representation.",
              "Character sets: explain how characters are represented using ASCII and Unicode, including the trade-off between range of characters and storage.",
              "Images: calculate bitmap file size from pixels and colour depth, and explain how resolution and colour depth affect quality and storage.",
              "Sound: calculate sound file size using sample rate, sample resolution, duration and channels; link higher sampling choices to quality and storage.",
              "Compression: distinguish lossy and lossless compression, including when each is suitable and what data may be lost."
            ]
          },
          {
            code: "9618-1.2",
            title: "Multimedia, sound and graphics",
            items: [
              "Bitmap graphics: use pixel grids, metadata, resolution and colour depth accurately in explanations and calculations.",
              "Vector graphics: describe objects, attributes and coordinates, and compare scalability with bitmap images.",
              "Sampling: describe analogue-to-digital conversion for sound and the effect of sample rate and resolution.",
              "Media suitability: choose bitmap, vector or sampled sound settings for a scenario using quality, storage and transmission constraints."
            ]
          },
          {
            code: "9618-1.3",
            title: "Compression",
            items: [
              "Lossless compression: original data can be reconstructed exactly, making it suitable for text, program files and critical data.",
              "Run-length encoding: store repeated consecutive values as a value plus count, and calculate the effect on file size.",
              "Lossy compression: removes or approximates data permanently, making it suitable for many image, audio and video uses.",
              "Compression evaluation: compare compression ratio, quality loss, storage saving and transmission speed for a given use case."
            ]
          }
        ]
      },
      {
        chapter: "2",
        title: "Communication",
        sections: [
          {
            code: "9618-2.1",
            title: "Networks",
            items: [
              "Network purpose: explain resource sharing, communication and centralised management in LANs, WANs and client-server systems.",
              "Network hardware: describe routers, switches, wireless access points, NICs and transmission media in context.",
              "Addressing: use IP addresses, MAC addresses, ports and URLs correctly when explaining communication between devices.",
              "Packets: describe packet structure, packet switching, routing and reassembly, including sequence numbers and error handling.",
              "Protocols: match protocols such as HTTP, HTTPS, FTP, SMTP, POP3, IMAP, TCP/IP and Ethernet to their roles.",
              "Cloud and internet services: explain benefits and risks such as accessibility, scalability, dependence on connectivity and security."
            ]
          },
          {
            code: "9618-2.2",
            title: "Internet principles",
            items: [
              "DNS: explain how a domain name is resolved to an IP address before a web resource is requested.",
              "Web transfer: describe the roles of browser, web server, URL, HTTP/HTTPS request and response.",
              "Client-server model: distinguish client requests from server processing, storage and response.",
              "Security during transmission: explain encryption, certificates and authentication when data is sent over public networks."
            ]
          }
        ]
      },
      {
        chapter: "3",
        title: "Hardware",
        sections: [
          {
            code: "9618-3.1",
            title: "Processor fundamentals",
            items: [
              "CPU components: describe the ALU, control unit, registers, buses and clock in the fetch-decode-execute cycle.",
              "Registers: use the roles of PC, MAR, MDR, CIR, accumulator and status register accurately in FDE explanations.",
              "Interrupts: explain interrupt handling, interrupt service routines and the effect on normal program execution.",
              "Performance factors: compare clock speed, number of cores, cache size and word length using scenario evidence.",
              "Instruction set concepts: explain opcode, operand, addressing and how machine-code instructions are executed."
            ]
          },
          {
            code: "9618-3.2",
            title: "Assembly language",
            items: [
              "Low-level code: distinguish machine code from assembly language and explain why assemblers are needed.",
              "Assembly instructions: trace simple instructions such as load, store, add, compare and branch using register values.",
              "Addressing: describe immediate, direct, indirect and indexed addressing where required by the question.",
              "Translation: explain how labels, mnemonics and operands are converted into executable machine code."
            ]
          },
          {
            code: "9618-3.3",
            title: "Input, output and storage",
            items: [
              "Input/output choice: select suitable devices for a scenario and justify with accuracy, speed, cost, durability and user needs.",
              "Sensors and control: explain how sensors, ADCs, processors, DACs and actuators are used in monitoring and control systems.",
              "Primary memory: compare RAM, ROM and cache by volatility, purpose, speed and capacity.",
              "Secondary storage: compare magnetic, optical and solid-state storage using capacity, access speed, portability, reliability and cost.",
              "Embedded systems: describe dedicated hardware and software designed for a specific task, including benefits and limitations."
            ]
          }
        ]
      },
      {
        chapter: "4",
        title: "Processor fundamentals",
        sections: [
          {
            code: "9618-4.1",
            title: "Central processing unit architecture",
            items: [
              "Von Neumann architecture: explain shared memory for data and instructions and the movement of data across buses.",
              "System buses: distinguish address, data and control buses and state the direction or purpose of each transfer.",
              "FDE detail: track the program counter, memory address register, memory data register and current instruction register through a cycle.",
              "Pipelining awareness: explain how overlapping fetch, decode and execute stages can improve throughput when the question introduces it."
            ]
          },
          {
            code: "9618-4.2",
            title: "Performance and instruction execution",
            items: [
              "Clock and cores: explain why faster clock speed or more cores may improve performance but do not guarantee every program runs faster.",
              "Cache: describe how frequently used data and instructions are held close to the CPU to reduce memory access time.",
              "Word length: link word length to the amount of data processed in one operation and the addressable memory where relevant.",
              "Bottlenecks: use context to identify limits such as memory speed, storage access, network latency or software design."
            ]
          }
        ]
      },
      {
        chapter: "5",
        title: "System software",
        sections: [
          {
            code: "9618-5.1",
            title: "Operating systems",
            items: [
              "OS role: manage hardware, software, files, users and security while providing a user interface.",
              "Process management: explain scheduling, multitasking, interrupts and how the OS allocates processor time.",
              "Memory management: describe loading programs, managing RAM, virtual memory and preventing processes interfering with each other.",
              "File management: explain directories, permissions, naming, storage allocation and file operations.",
              "Device management: explain drivers, buffering, spooling and how peripherals communicate with the system."
            ]
          },
          {
            code: "9618-5.2",
            title: "Utility software",
            items: [
              "Utilities: match software such as backup, compression, encryption, antivirus, defragmentation and disk formatting to their purposes.",
              "Security utilities: explain malware scanning, quarantine, firewall settings and update routines.",
              "Maintenance: describe how utility software improves reliability, storage efficiency and recoverability."
            ]
          },
          {
            code: "9618-5.3",
            title: "Language translators",
            items: [
              "Translator types: distinguish assembler, compiler and interpreter by input language, output and execution approach.",
              "Compilation stages: explain lexical analysis, syntax analysis, semantic checks, code generation and optimisation at an AS-level depth.",
              "Errors: identify syntax, semantic and logic errors and state when they are detected.",
              "Linking and loading: explain how object code, libraries and executable programs are brought together where required."
            ]
          }
        ]
      },
      {
        chapter: "6",
        title: "Security, privacy and data integrity",
        sections: [
          {
            code: "9618-6.1",
            title: "Data security",
            items: [
              "Threats: identify malware, phishing, social engineering, unauthorised access, interception and denial-of-service attacks.",
              "Protection: match threats to encryption, firewalls, access rights, strong authentication, backups and user training.",
              "Authentication: compare passwords, biometrics, tokens and two-factor authentication using security and usability.",
              "Encryption: explain symmetric and asymmetric encryption, public/private keys and why secure key exchange matters.",
              "Backup and recovery: design backup strategies using frequency, media, off-site storage and restoration testing."
            ]
          },
          {
            code: "9618-6.2",
            title: "Data integrity and privacy",
            items: [
              "Validation: use range, type, length, format, presence and check digit checks to reduce invalid input.",
              "Verification: use double entry, proofreading or parity-style methods to check data has been transferred or entered accurately.",
              "Error detection: explain parity, checksum and automatic repeat request for transmitted data.",
              "Privacy: discuss access control, encryption, data minimisation and legal or ethical responsibilities for personal data."
            ]
          }
        ]
      },
      {
        chapter: "7",
        title: "Ethics and ownership",
        sections: [
          {
            code: "9618-7.1",
            title: "Ethics and computing",
            items: [
              "Ethical analysis: balance benefits and drawbacks for users, organisations and society rather than writing one-sided answers.",
              "Privacy: discuss surveillance, data collection, consent, profiling and the consequences of data misuse.",
              "Environmental impact: explain energy use, e-waste, manufacturing impact and ways to reduce harm.",
              "Digital divide: discuss unequal access to devices, connectivity, skills and services.",
              "Professional responsibility: consider accuracy, safety, bias, accessibility and accountability in computer systems."
            ]
          },
          {
            code: "9618-7.2",
            title: "Ownership and legislation",
            items: [
              "Copyright: explain ownership of software, media and data, including licensing and consequences of unauthorised copying.",
              "Computer misuse: identify unauthorised access, modification and malware-related offences in scenarios.",
              "Data protection: describe lawful, fair, accurate, secure and limited use of personal data at a principle level.",
              "Intellectual property: distinguish copyright, patents, trademarks and licensing where a question gives context."
            ]
          }
        ]
      },
      {
        chapter: "8",
        title: "Databases",
        sections: [
          {
            code: "9618-8.1",
            title: "Database concepts",
            items: [
              "Database structure: explain entities, attributes, records, fields, tables and relationships using precise terms.",
              "Keys: distinguish primary keys, foreign keys and candidate keys, and justify key choice using uniqueness and relationships.",
              "Normalisation awareness: reduce repeated data and update anomalies by separating related data into linked tables.",
              "Referential integrity: explain how foreign keys keep linked records consistent.",
              "DBMS: describe data definition, data manipulation, security, backup, concurrency control and data independence roles."
            ]
          },
          {
            code: "9618-8.2",
            title: "SQL and data modelling",
            items: [
              "SELECT queries: use SELECT, FROM, WHERE and ORDER BY correctly, including comparison operators and logical conditions.",
              "Aggregate queries: use COUNT, SUM, AVG, MIN and MAX when a question asks for totals, counts or summaries.",
              "Joins: use primary and foreign key relationships to retrieve data from more than one table where required.",
              "Data definition: recognise creating tables, defining fields, data types, keys and constraints at a basic level.",
              "Query accuracy: return only the requested fields and records; avoid selecting all fields unless the question asks for them."
            ]
          }
        ]
      }
    ],
    paper2: [
      {
        chapter: "9",
        title: "Algorithm design and problem-solving",
        sections: [
          {
            code: "9618-9.1",
            title: "Computational thinking",
            items: [
              "Decomposition: break a problem into input, processing, output, storage and subroutine parts before writing an algorithm.",
              "Abstraction: remove irrelevant detail and keep the data, rules and outputs that affect the solution.",
              "Algorithm design: use sequence, selection, iteration and modular subroutines to produce a finite, clear solution.",
              "Structure charts and flowcharts: interpret and produce diagrams that show control flow or modular structure.",
              "Dry runs: trace algorithms with representative data to predict outputs and find logic errors."
            ]
          },
          {
            code: "9618-9.2",
            title: "Standard algorithms",
            items: [
              "Searching: apply linear search and binary search, including the need for ordered data in binary search.",
              "Sorting: trace bubble sort and insertion sort, and explain swaps, passes and termination.",
              "Counting and totals: initialise accumulators and counters before loops and update them in the correct branch.",
              "Maximum and minimum: initialise carefully and update when a more extreme value is found.",
              "Efficiency: compare algorithms using the number of comparisons, passes or loops when the question asks for suitability."
            ]
          },
          {
            code: "9618-9.3",
            title: "Testing and validation",
            items: [
              "Test plans: select normal, abnormal and boundary data with expected outcomes.",
              "Validation: write checks for type, range, length, format, presence and check digits in pseudocode.",
              "Verification: use double entry or visual checking when data transfer accuracy matters.",
              "Error types: distinguish syntax, logic and runtime errors and link each to detection or correction methods.",
              "Trace tables: update variables in execution order and include loop counters, flags and output values."
            ]
          }
        ]
      },
      {
        chapter: "10",
        title: "Data types and structures",
        sections: [
          {
            code: "9618-10.1",
            title: "Data types and records",
            items: [
              "Primitive types: choose integer, real, char, string, Boolean or date types to match the data and operations.",
              "User-defined types: define enumerated types, pointer types and composite types when they make data clearer.",
              "Records: group fields of different types under one identifier and access fields using record notation.",
              "Constants and variables: use constants for fixed values and meaningful identifiers for data that changes.",
              "Type conversion: convert between compatible types only when the algorithm needs it."
            ]
          },
          {
            code: "9618-10.2",
            title: "Arrays and files",
            items: [
              "1D arrays: store lists of related values and process them with loops and indexes.",
              "2D arrays: store table-style data and use nested loops for rows and columns.",
              "File handling: open, read, write, append and close files using the pseudocode style required by the question.",
              "Serial files: process records in order, detect end-of-file conditions and preserve data when updating files.",
              "CSV-style thinking: separate fields and records clearly when reading or writing structured text."
            ]
          },
          {
            code: "9618-10.3",
            title: "Abstract data types",
            items: [
              "Stacks: use LIFO behaviour with push, pop, peek, empty and full operations.",
              "Queues: use FIFO behaviour with enqueue, dequeue, front, rear, empty and full operations.",
              "Linked lists: use nodes and pointers to insert, delete and traverse items without relying on contiguous storage.",
              "Binary trees: describe root, node, leaf, left/right child and traversal where the question introduces tree structures.",
              "ADT implementation: explain how arrays and pointers can be used to implement stacks, queues and linked lists."
            ]
          }
        ]
      },
      {
        chapter: "11",
        title: "Programming",
        sections: [
          {
            code: "9618-11.1",
            title: "Programming basics",
            items: [
              "Assignments: store evaluated expressions in variables and update values in the correct sequence.",
              "Selection: write IF, ELSE and CASE logic with complete conditions and appropriate branches.",
              "Iteration: choose FOR, WHILE or REPEAT loops according to count-controlled, pre-condition or post-condition needs.",
              "Nested logic: indent and structure nested loops or selections so scope is clear.",
              "Operators: use arithmetic, relational and Boolean operators accurately, including MOD and DIV when needed."
            ]
          },
          {
            code: "9618-11.2",
            title: "Subroutines",
            items: [
              "Procedures: write reusable blocks that perform actions without returning a value.",
              "Functions: return exactly the value required by the calling code.",
              "Parameters: pass data by value or by reference where the question distinguishes the two.",
              "Local and global scope: state where identifiers can be accessed and avoid accidental dependence on global data.",
              "Modular design: split a solution into named subroutines that match the scenario's tasks."
            ]
          },
          {
            code: "9618-11.3",
            title: "Pseudocode practice",
            items: [
              "9618 answer format: Paper 2 expects pseudocode, program code or flowcharts; the syllabus does not require a specific high-level programming language.",
              "Input/output: use INPUT and OUTPUT clearly and keep prompts, validation messages and final results distinct.",
              "String handling: use length, substring, character access, concatenation and case conversion as required by the problem.",
              "Robust algorithms: include initialisation, loop termination, validation, error messages and final output.",
              "Readable answers: use meaningful identifiers, consistent indentation and comments only where they clarify non-obvious logic."
            ]
          }
        ]
      },
      {
        chapter: "12",
        title: "Software development",
        sections: [
          {
            code: "9618-12.1",
            title: "Program development life cycle",
            items: [
              "Analysis: identify the problem, inputs, outputs, processing, storage and constraints.",
              "Design: produce algorithms, data structures, user interface plans and test strategies before coding.",
              "Development: implement the design using structured programming and meaningful identifiers.",
              "Testing: compare actual outputs with expected outputs and record corrections.",
              "Maintenance: explain corrective, adaptive and perfective maintenance using realistic examples."
            ]
          },
          {
            code: "9618-12.2",
            title: "Programming paradigms and IDEs",
            items: [
              "Programming paradigms: distinguish low-level, procedural, object-oriented and declarative styles at a basic AS level.",
              "IDE tools: explain editor, translator, debugger, breakpoints, watch windows and step-through execution.",
              "Debugging: use trace, breakpoints and variable inspection to find where actual behaviour first differs from expected behaviour.",
              "Code quality: improve maintainability with modularity, naming, layout, comments and avoidance of duplicated logic."
            ]
          }
        ]
      }
    ]
  };

  const syllabusChecklists = {
    "caie-igcse-0478": {
      label: "IGCSE 0478",
      title: "Cambridge IGCSE Computer Science",
      papers: syllabusChecklist
    },
    "caie-as-a-level-9618": {
      label: "AS & A Level 9618",
      title: "Cambridge International AS & A Level Computer Science",
      papers: asLevel9618Checklist
    }
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

  const paperSessionCatalogs = {
    "caie-igcse-0478": paperSessions.map((session) => ({ subjectCode: "0478", ...session })),
    "caie-as-a-level-9618": [
      { subjectCode: "9618", year: 2025, season: "May/June", code: "s", components: ["11", "12", "13", "21", "22", "23", "31", "32", "33", "41", "42", "43"], open: true },
      { subjectCode: "9618", year: 2025, season: "Oct/Nov", code: "w", components: ["11", "12", "13", "21", "22", "23", "31", "32", "33", "41", "42", "43"], open: true },
      { subjectCode: "9618", year: 2024, season: "May/June", code: "s", components: ["11", "12", "13", "21", "22", "23", "31", "32", "33", "41", "42", "43"] },
      { subjectCode: "9618", year: 2024, season: "Oct/Nov", code: "w", components: ["11", "12", "13", "21", "22", "23", "31", "32", "33", "41", "42", "43"] },
      { subjectCode: "9618", year: 2023, season: "May/June", code: "s", components: ["11", "12", "13", "21", "22", "23", "31", "32", "33", "41", "42", "43"] },
      { subjectCode: "9618", year: 2023, season: "Oct/Nov", code: "w", components: ["11", "12", "13", "21", "22", "23", "31", "32", "33", "41", "42", "43"] },
      { subjectCode: "9618", year: 2022, season: "May/June", code: "s", components: ["11", "12", "13", "21", "22", "23", "31", "32", "33", "41", "42", "43"], legacy: true },
      { subjectCode: "9618", year: 2022, season: "Oct/Nov", code: "w", components: ["11", "12", "13", "21", "22", "23", "31", "32", "33", "41", "42", "43"], legacy: true },
      { subjectCode: "9618", year: 2021, season: "May/June", code: "s", components: ["11", "12", "13", "21", "22", "23", "31", "32", "33", "41", "42", "43"], legacy: true },
      { subjectCode: "9618", year: 2021, season: "Oct/Nov", code: "w", components: ["11", "12", "13", "21", "22", "23", "31", "32", "41", "42"], legacy: true }
    ]
  };

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
      parts: [
        {
          label: "Question 1",
          prompt: "Identify what is meant by virtual memory.",
          markScheme: "Partitioned secondary storage used as virtual memory."
        },
        {
          label: "Question 2",
          prompt: "Describe how magnetic storage stores data.",
          markScheme:
            "Magnetic storage uses tracks/sectors, rotating platters, moving parts, a read/write head, an electromagnet, and magnetised dots."
        },
        {
          label: "Question 3",
          prompt: "Explain why a hard disk drive (HDD) is secondary storage.",
          markScheme: "An HDD is not directly accessed by the CPU and is non-volatile/permanent until deleted."
        }
      ],
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

  return {
    topicBank,
    sourceLibrary,
    syllabusChecklists,
    syllabusChecklist,
    asLevel9618Checklist,
    chapterOneSections,
    paperSessions,
    paperSessionCatalogs,
    pastPaperQuestionBank
  };
});
