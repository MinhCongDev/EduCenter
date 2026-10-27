export interface PlacementOption {
  key: string;
  text: string;
}

export interface PlacementQuestion {
  id: string;
  questionNumber: number;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE_NOT_GIVEN' | 'MATCHING' | 'SUMMARY_COMPLETION';
  section: string;
  passageId?: string;
  questionText: string;
  options: PlacementOption[];
  correctAnswer: string;
  explanation: string;
  skill: 'Grammar' | 'Vocabulary' | 'Reading' | 'Critical Reasoning';
}

export interface PlacementPassage {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
}

export interface RecommendedCourseDetail {
  code: string;
  title: string;
  targetLevel: string;
  tuitionFee: number;
  durationWeeks: number;
  badge: string;
  description: string;
  whyRecommended: string;
  highlights: string[];
}

export interface PlacementTest {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  targetLevel: string;
  durationMinutes: number;
  totalQuestions: number;
  difficulty: 'Cơ bản - Trung cấp' | 'Trung cấp - Khá' | 'Nâng cao - Chuyên sâu';
  bannerUrl: string;
  description: string;
  instructions: string[];
  passages?: PlacementPassage[];
  questions: PlacementQuestion[];
  getRecommendations: (score: number, total: number) => {
    predictedBand: number;
    bandRange: string;
    levelName: string;
    summaryFeedback: string;
    primaryCourse: RecommendedCourseDetail;
    secondaryCourses: RecommendedCourseDetail[];
  };
}

export const PLACEMENT_TESTS: PlacementTest[] = [
  // =========================================================================
  // BÀI TEST 1: IELTS Diagnostic Placement Test (Nền tảng & Đọc hiểu Cơ bản)
  // =========================================================================
  {
    id: 'ielts-diagnostic-01',
    title: 'IELTS Diagnostic Placement Test - Ngữ Pháp & Từ Vựng Cốt Lõi',
    subtitle: 'Đánh giá năng lực xuất phát điểm từ Mất gốc đến Trung cấp (Band 0 - 5.5)',
    category: 'Chẩn đoán nền tảng',
    targetLevel: 'Band 0.0 - 5.5',
    durationMinutes: 30,
    totalQuestions: 25,
    difficulty: 'Cơ bản - Trung cấp',
    bannerUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop',
    description:
      'Bài thi chẩn đoán tổng quan các chủ điểm ngữ pháp cốt lõi, từ vựng học thuật thiết yếu và kỹ năng đọc hiểu văn bản ngắn. Phù hợp cho người bắt đầu hoặc cần xác định lộ trình học từ con số 0.',
    instructions: [
      'Bài thi gồm 25 câu hỏi trắc nghiệm, thời gian làm bài là 30 phút.',
      'Không sử dụng từ điển, tài liệu tra cứu hoặc công cụ dịch trong quá trình làm bài.',
      'Hệ thống sẽ tự động nộp bài khi hết thời gian đếm ngược.',
      'Sau khi nộp bài, bạn sẽ nhận được điểm số, dự đoán Band điểm và gợi ý khóa học phù hợp nhất.',
    ],
    passages: [
      {
        id: 'p1_lang',
        title: 'The Evolution of Human Written Communication',
        subtitle: 'From Pictographs to the Digital Era',
        content: `The earliest known forms of human writing emerged independently in different parts of the ancient world around 5,000 years ago. In Mesopotamia, the Sumerians developed cuneiform script by pressing wedge-shaped reeds into soft clay tablets. Initially designed for agricultural accounting and inventory recording, this utilitarian system rapidly evolved into a sophisticated tool capable of recording legal codes, mythological epics, and astronomical observations.\n\nSimultaneously, ancient Egyptians devised hieroglyphs, a sacred script blending logographic and alphabetic elements. Unlike clay tablets, Egyptians utilized papyrus, an early paper-like substrate derived from marsh reeds. This material offered greater portability, enabling efficient state administration and widespread dissemination of religious literature. However, hieroglyphic literacy was restricted to a privileged scribal caste, ensuring administrative power remained concentrated among elite bureaucrats.\n\nThe decisive breakthrough toward modern literacy occurred with the Phoenician alphabet around 1050 BCE. Unlike earlier pictographic systems requiring memorization of thousands of individual signs, the Phoenicians assigned individual symbols to distinct consonant sounds. Consisting of just 22 characters, this revolutionary phonetic alphabet dramatically democratized literacy, later giving rise to the Greek, Latin, and Cyrillic scripts that dominate the contemporary global landscape.`,
      },
    ],
    questions: [
      {
        id: 'd1_q1',
        questionNumber: 1,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 1: Grammar & Verb Tenses',
        questionText:
          'By the time the new language laboratory opened last month, the academy _______ more than two hundred computer-delivered workstations.',
        options: [
          { key: 'A', text: 'installs' },
          { key: 'B', text: 'has installed' },
          { key: 'C', text: 'had installed' },
          { key: 'D', text: 'was installing' },
        ],
        correctAnswer: 'C',
        explanation:
          'Hành động lắp đặt hoàn thành trước một mốc thời gian trong quá khứ ("by the time the laboratory opened"), nên dùng thì Quá khứ hoàn thành (Past Perfect: had + V3/ed).',
        skill: 'Grammar',
      },
      {
        id: 'd1_q2',
        questionNumber: 2,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 1: Grammar & Verb Tenses',
        questionText:
          'Neither the Head of Admissions nor the senior teachers _______ satisfied with the outdated listening equipment.',
        options: [
          { key: 'A', text: 'was' },
          { key: 'B', text: 'were' },
          { key: 'C', text: 'is' },
          { key: 'D', text: 'are being' },
        ],
        correctAnswer: 'B',
        explanation:
          'Quy tắc hòa hợp chủ vị với cấu trúc "Neither... nor...": Động từ hòa hợp với chủ ngữ gần nó nhất. Ở đây "the senior teachers" là danh từ số nhiều ở quá khứ, do đó chia "were".',
        skill: 'Grammar',
      },
      {
        id: 'd1_q3',
        questionNumber: 3,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 1: Grammar & Verb Tenses',
        questionText:
          'If the candidate _______ more attention to the word limit instruction in Task 2, she would not have lost critical marks.',
        options: [
          { key: 'A', text: 'paid' },
          { key: 'B', text: 'would pay' },
          { key: 'C', text: 'had paid' },
          { key: 'D', text: 'has paid' },
        ],
        correctAnswer: 'C',
        explanation:
          'Câu điều kiện loại 3 diễn tả giả định trái ngược với quá khứ: Mệnh đề If dùng Past Perfect (had + V3/ed), mệnh đề chính dùng would have + V3/ed.',
        skill: 'Grammar',
      },
      {
        id: 'd1_q4',
        questionNumber: 4,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 1: Grammar & Verb Tenses',
        questionText:
          'The research proposal _______ by the academic committee before any field experiments can commence.',
        options: [
          { key: 'A', text: 'must approve' },
          { key: 'B', text: 'must be approved' },
          { key: 'C', text: 'must have approved' },
          { key: 'D', text: 'is approving' },
        ],
        correctAnswer: 'B',
        explanation:
          'Thể bị động với động từ khuyết thiếu (Modal verb passive): must + be + V3/ed. Bản đề xuất phải "được phê duyệt".',
        skill: 'Grammar',
      },
      {
        id: 'd1_q5',
        questionNumber: 5,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 1: Grammar & Verb Tenses',
        questionText:
          'The student confessed _______ the mock exam questions to his peer prior to the testing session.',
        options: [
          { key: 'A', text: 'to disclose' },
          { key: 'B', text: 'disclose' },
          { key: 'C', text: 'to having disclosed' },
          { key: 'D', text: 'disclosed' },
        ],
        correctAnswer: 'C',
        explanation:
          'Cấu trúc "confess to + V-ing/having + V3": Thú nhận đã làm gì trong quá khứ.',
        skill: 'Grammar',
      },
      {
        id: 'd1_q6',
        questionNumber: 6,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 1: Grammar & Verb Tenses',
        questionText:
          'Rarely _______ such an insightful analysis of academic collocations in undergraduate dissertations.',
        options: [
          { key: 'A', text: 'we encounter' },
          { key: 'B', text: 'do we encounter' },
          { key: 'C', text: 'we have encountered' },
          { key: 'D', text: 'did we encountered' },
        ],
        correctAnswer: 'B',
        explanation:
          'Cấu trúc đảo ngữ với trạng từ phủ định/bán phủ định đứng đầu câu ("Rarely"): Rarely + trợ động từ + S + V nguyên thể ("Rarely do we encounter").',
        skill: 'Grammar',
      },
      {
        id: 'd1_q7',
        questionNumber: 7,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 1: Grammar & Verb Tenses',
        questionText:
          'The candidate wondered whether the tuition fee included study materials, _______ the receptionist confirmed.',
        options: [
          { key: 'A', text: 'which' },
          { key: 'B', text: 'that' },
          { key: 'C', text: 'what' },
          { key: 'D', text: 'where' },
        ],
        correctAnswer: 'A',
        explanation:
          'Mệnh đề quan hệ không xác định thay thế cho toàn bộ mệnh đề đứng trước dùng đại từ quan hệ "which".',
        skill: 'Grammar',
      },
      {
        id: 'd1_q8',
        questionNumber: 8,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 1: Grammar & Verb Tenses',
        questionText:
          'It is imperative that every enrolled candidate _______ the placement assessment before selecting a module.',
        options: [
          { key: 'A', text: 'completes' },
          { key: 'B', text: 'complete' },
          { key: 'C', text: 'completed' },
          { key: 'D', text: 'is completing' },
        ],
        correctAnswer: 'B',
        explanation:
          'Thể giả định (Subjunctive mood) sau cấu trúc "It is imperative that + S + (should) + V (nguyên thể không chia)": complete.',
        skill: 'Grammar',
      },
      {
        id: 'd1_q9',
        questionNumber: 9,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 2: Academic Vocabulary & Collocations',
        questionText:
          'Many students struggle to _______ a balance between rigorous test preparation and personal well-being.',
        options: [
          { key: 'A', text: 'strike' },
          { key: 'B', text: 'hit' },
          { key: 'C', text: 'catch' },
          { key: 'D', text: 'beat' },
        ],
        correctAnswer: 'A',
        explanation:
          'Collocation học thuật chuẩn: "strike a balance" nghĩa là tạo ra hoặc duy trì sự cân bằng hợp lý.',
        skill: 'Vocabulary',
      },
      {
        id: 'd1_q10',
        questionNumber: 10,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 2: Academic Vocabulary & Collocations',
        questionText:
          'The government implemented new policies to _______ the economic disparity between urban and rural students.',
        options: [
          { key: 'A', text: 'bridge' },
          { key: 'B', text: 'span' },
          { key: 'C', text: 'cross' },
          { key: 'D', text: 'link' },
        ],
        correctAnswer: 'A',
        explanation:
          'Collocation thông dụng: "bridge the gap / bridge the disparity" nghĩa là thu hẹp khoảng cách/chênh lệch.',
        skill: 'Vocabulary',
      },
      {
        id: 'd1_q11',
        questionNumber: 11,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 2: Academic Vocabulary & Collocations',
        questionText:
          'The newly appointed instructor has an _______ reputation for boosting students’ Speaking scores.',
        options: [
          { key: 'A', text: 'impeccable' },
          { key: 'B', text: 'imperfect' },
          { key: 'C', text: 'inflated' },
          { key: 'D', text: 'imprecise' },
        ],
        correctAnswer: 'A',
        explanation:
          '"impeccable reputation" (danh tiếng hoàn hảo, không tì vết) là tính từ học thuật mang nghĩa khen ngợi cao độ.',
        skill: 'Vocabulary',
      },
      {
        id: 'd1_q12',
        questionNumber: 12,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 2: Academic Vocabulary & Collocations',
        questionText:
          'Fluency in academic English is an _______ asset for anyone pursuing a postgraduate scholarship abroad.',
        options: [
          { key: 'A', text: 'invaluable' },
          { key: 'B', text: 'worthless' },
          { key: 'C', text: 'inexpensive' },
          { key: 'D', text: 'invalid' },
        ],
        correctAnswer: 'A',
        explanation:
          '"invaluable" mang nghĩa vô giá, cực kỳ quý báu (khác với worthless là vô giá trị).',
        skill: 'Vocabulary',
      },
      {
        id: 'd1_q13',
        questionNumber: 13,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 2: Academic Vocabulary & Collocations',
        questionText:
          'During the lecture, the professor drew a sharp _______ between qualitative and quantitative research methodologies.',
        options: [
          { key: 'A', text: 'distinction' },
          { key: 'B', text: 'separation' },
          { key: 'C', text: 'discord' },
          { key: 'D', text: 'divergence' },
        ],
        correctAnswer: 'A',
        explanation:
          'Collocation học thuật: "draw a distinction between A and B" nghĩa là phân biệt rạch ròi giữa A và B.',
        skill: 'Vocabulary',
      },
      {
        id: 'd1_q14',
        questionNumber: 14,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 2: Academic Vocabulary & Collocations',
        questionText:
          'The university’s intensive writing workshop is _______ at equipping students with critical thinking skills.',
        options: [
          { key: 'A', text: 'aimed' },
          { key: 'B', text: 'intended' },
          { key: 'C', text: 'focused' },
          { key: 'D', text: 'targeted' },
        ],
        correctAnswer: 'A',
        explanation:
          'Đi kèm giới từ "at" với nghĩa nhằm mục đích gì là "be aimed at + V-ing". (Targeted đi với at nhưng intended đi với for/to, focused đi với on).',
        skill: 'Vocabulary',
      },
      {
        id: 'd1_q15',
        questionNumber: 15,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 2: Academic Vocabulary & Collocations',
        questionText:
          'Repeated practice under exam conditions helps candidates overcome test anxiety and _______ their confidence.',
        options: [
          { key: 'A', text: 'bolster' },
          { key: 'B', text: 'alleviate' },
          { key: 'C', text: 'diminish' },
          { key: 'D', text: 'squander' },
        ],
        correctAnswer: 'A',
        explanation:
          '"bolster confidence" nghĩa là củng cố, tăng cường sự tự tin. "alleviate" nghĩa là giảm nhẹ (nỗi đau, lo âu), không đi với confidence trong ngữ cảnh này.',
        skill: 'Vocabulary',
      },
      {
        id: 'd1_q16',
        questionNumber: 16,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 2: Academic Vocabulary & Collocations',
        questionText:
          'The survey revealed that candidates who read academic journals regularly have a _______ larger vocabulary.',
        options: [
          { key: 'A', text: 'substantially' },
          { key: 'B', text: 'strictly' },
          { key: 'C', text: 'severely' },
          { key: 'D', text: 'narrowly' },
        ],
        correctAnswer: 'A',
        explanation:
          '"substantially larger" (lớn hơn đáng kể) là phó từ nhấn mạnh so sánh hơn thường gặp trong văn phong học thuật IELTS.',
        skill: 'Vocabulary',
      },
      {
        id: 'd1_q17',
        questionNumber: 17,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 3: Error Identification & Sentence Cohesion',
        questionText:
          'Identify the underlined part that contains an error: "Although [A] the candidate worked very diligent [B] throughout the course, she failed [C] to achieve the required band score [D]."',
        options: [
          { key: 'A', text: '[A] Although' },
          { key: 'B', text: '[B] worked very diligent' },
          { key: 'C', text: '[C] failed' },
          { key: 'D', text: '[D] band score' },
        ],
        correctAnswer: 'B',
        explanation:
          'Động từ "worked" cần được bổ nghĩa bởi trạng từ "diligently", không thể dùng tính từ "diligent". Sửa thành: "worked very diligently".',
        skill: 'Critical Reasoning',
      },
      {
        id: 'd1_q18',
        questionNumber: 18,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 3: Error Identification & Sentence Cohesion',
        questionText:
          'Identify the underlined part that contains an error: "The number of [A] international applicants seeking [B] admission have decreased [C] significantly over [D] the past two years."',
        options: [
          { key: 'A', text: '[A] The number of' },
          { key: 'B', text: '[B] seeking' },
          { key: 'C', text: '[C] have decreased' },
          { key: 'D', text: '[D] over' },
        ],
        correctAnswer: 'C',
        explanation:
          'Chủ ngữ là "The number of..." luôn đi với động từ số ít. Sửa "have decreased" thành "has decreased".',
        skill: 'Grammar',
      },
      {
        id: 'd1_q19',
        questionNumber: 19,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 3: Error Identification & Sentence Cohesion',
        questionText:
          'Choose the best sentence to connect the two clauses: "Online learning offers geographic flexibility. _______, it often lacks the interpersonal dynamics of a traditional classroom."',
        options: [
          { key: 'A', text: 'Furthermore' },
          { key: 'B', text: 'Consequently' },
          { key: 'C', text: 'Conversely' },
          { key: 'D', text: 'In particular' },
        ],
        correctAnswer: 'C',
        explanation:
          'Hai mệnh đề thể hiện sự tương phản (ưu điểm về địa lý đối lập với nhược điểm thiếu tương tác), do đó dùng từ nối chỉ sự đối lập "Conversely" (Ngược lại).',
        skill: 'Critical Reasoning',
      },
      {
        id: 'd1_q20',
        questionNumber: 20,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 3: Error Identification & Sentence Cohesion',
        questionText:
          'Which of the following sentences exhibits the most formal academic tone suitable for IELTS Writing Task 2?',
        options: [
          { key: 'A', text: 'A lot of folks think kids should get lots of homework every day.' },
          { key: 'B', text: 'It is widely argued that regular homework assignments foster academic discipline in schoolchildren.' },
          { key: 'C', text: 'People say kids gotta do their homework to be smart.' },
          { key: 'D', text: 'I think that doing homework makes students really great at school.' },
        ],
        correctAnswer: 'B',
        explanation:
          'Câu B sử dụng cấu trúc bị động khách quan ("It is widely argued that..."), danh từ hóa học thuật ("foster academic discipline"), không dùng từ ngữ suồng sã hay đại từ nhân xưng phi trang trọng.',
        skill: 'Critical Reasoning',
      },
      {
        id: 'd1_q21',
        questionNumber: 21,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 3: Error Identification & Sentence Cohesion',
        questionText:
          'Choose the word that best completes the sentence: "The study’s findings are _______ with earlier theories proposed by Cambridge linguists."',
        options: [
          { key: 'A', text: 'consistent' },
          { key: 'B', text: 'reliable' },
          { key: 'C', text: 'identical' },
          { key: 'D', text: 'equivalent' },
        ],
        correctAnswer: 'A',
        explanation:
          'Collocation chuẩn đi với "with": "consistent with" (nhất quán, phù hợp với các lý thuyết trước đó).',
        skill: 'Vocabulary',
      },
      {
        id: 'd1_q22',
        questionNumber: 22,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 4: Reading Comprehension',
        passageId: 'p1_lang',
        questionText:
          'According to the passage, what was the original primary function of Sumerian cuneiform script?',
        options: [
          { key: 'A', text: 'Recording mythological poetry and folklore' },
          { key: 'B', text: 'Agricultural bookkeeping and inventory records' },
          { key: 'C', text: 'Inscribing royal legal decrees on monumental stones' },
          { key: 'D', text: 'Facilitating religious rituals among priest castes' },
        ],
        correctAnswer: 'B',
        explanation:
          'Trong đoạn 1 nêu rõ: "Initially designed for agricultural accounting and inventory recording, this utilitarian system rapidly evolved..."',
        skill: 'Reading',
      },
      {
        id: 'd1_q23',
        questionNumber: 23,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 4: Reading Comprehension',
        passageId: 'p1_lang',
        questionText:
          'Why did the use of papyrus benefit the ancient Egyptian administration compared to clay tablets?',
        options: [
          { key: 'A', text: 'It was indestructible and resisted moisture perfectly.' },
          { key: 'B', text: 'It allowed greater portability for managing state affairs.' },
          { key: 'C', text: 'It eliminated the need for specialized scribes.' },
          { key: 'D', text: 'It reduced the number of hieroglyphic characters needed.' },
        ],
        correctAnswer: 'B',
        explanation:
          'Đoạn 2 nêu: "This material offered greater portability, enabling efficient state administration and widespread dissemination..."',
        skill: 'Reading',
      },
      {
        id: 'd1_q24',
        questionNumber: 24,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 4: Reading Comprehension',
        passageId: 'p1_lang',
        questionText:
          'What fundamental innovation distinguished the Phoenician script from previous writing systems?',
        options: [
          { key: 'A', text: 'It was carved onto monumental bronze tablets instead of papyrus.' },
          { key: 'B', text: 'It assigned distinct symbols to individual consonant sounds.' },
          { key: 'C', text: 'It included vowel markings for everyday conversational speech.' },
          { key: 'D', text: 'It was exclusively memorized by an elite royal caste.' },
        ],
        correctAnswer: 'B',
        explanation:
          'Đoạn 3 chỉ rõ: "Unlike earlier pictographic systems requiring memorization of thousands of individual signs, the Phoenicians assigned individual symbols to distinct consonant sounds."',
        skill: 'Reading',
      },
      {
        id: 'd1_q25',
        questionNumber: 25,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 4: Reading Comprehension',
        passageId: 'p1_lang',
        questionText:
          'The word "democratized" in the final paragraph most nearly means:',
        options: [
          { key: 'A', text: 'Made accessible to a wider population' },
          { key: 'B', text: 'Restricted to elected political representatives' },
          { key: 'C', text: 'Replaced traditional democratic assemblies' },
          { key: 'D', text: 'Standardized across religious institutions' },
        ],
        correctAnswer: 'A',
        explanation:
          'Trong ngữ cảnh "democratized literacy", từ này có nghĩa là phổ cập, làm cho việc biết chữ trở nên dễ tiếp cận hơn với đông đảo đại chúng thay vì chỉ giới thượng lưu.',
        skill: 'Reading',
      },
    ],
    getRecommendations: (score: number, _total: number) => {
      if (score <= 2) {
        return {
          predictedBand: 1.0,
          bandRange: '0.0 - 2.0',
          levelName: 'Mất gốc hoàn toàn (Non-User A1)',
          summaryFeedback:
            'Bạn chưa trả lời chính xác câu hỏi nào (hoặc đúng rất ít câu). Kết quả phản ánh bạn bị mất gốc tiếng Anh hoặc chưa từng tiếp cận ngữ pháp và từ vựng căn bản. Khóa học "IELTS Mất Gốc & Phát Âm Chuẩn Quốc Tế" sẽ giúp bạn xây dựng lại nền tảng từ con số 0.',
          primaryCourse: {
            code: 'IELTS-LOST',
            title: 'IELTS Mất Gốc & Phát Âm Chuẩn Quốc Tế (0 - 3.5)',
            targetLevel: '3.5 - 4.5',
            tuitionFee: 4500000,
            durationWeeks: 8,
            badge: 'TỐI ƯU NHẤT CHO BẠN',
            description:
              'Khóa học được thiết kế dành riêng cho người mất gốc tiếng Anh hoàn toàn hoặc muốn xây dựng lại nền tảng phát âm IPA và ngữ pháp học thuật cốt lõi.',
            whyRecommended:
              'Bạn cần bắt đầu lại từ con số 0, chuẩn hóa 44 âm IPA và 12 thì cơ bản trước khi bước vào các dạng bài thi IELTS.',
            highlights: [
              'Chuẩn hóa 44 âm IPA theo giọng Anh - Mỹ chuẩn quốc tế',
              'Nắm chắc 12 chủ điểm ngữ pháp hay gặp nhất trong IELTS',
              'Tích lũy 1.500 từ vựng đời sống và học thuật nền tảng',
              'Cam kết tăng ít nhất 1.0 Band điểm sau 8 tuần học',
            ],
          },
          secondaryCourses: [
            {
              code: 'IELTS-PRE',
              title: 'IELTS Pre - Làm Quen Format Đề Thi Chuẩn (3.5 - 4.5)',
              targetLevel: '4.5 - 5.5',
              tuitionFee: 5800000,
              durationWeeks: 10,
              badge: 'BƯỚC TIẾP THEO',
              description: 'Khóa học kế tiếp sau khi hoàn thành nền tảng cơ bản.',
              whyRecommended: 'Lộ trình phát triển tự nhiên sau khóa Mất gốc.',
              highlights: ['Làm quen format đề thi chuẩn 4 kỹ năng', 'Rèn luyện Skimming & Scanning'],
            },
          ],
        };
      } else if (score < 8) {
        return {
          predictedBand: 2.5,
          bandRange: '2.0 - 3.0',
          levelName: 'Sơ khởi / Extremely Limited (A1-A2)',
          summaryFeedback:
            'Bạn nhận biết được một vài từ vựng căn bản nhưng phản xạ ngữ pháp còn yếu và thường đoán mò. Cần củng cố gốc rễ 12 thì và phát âm IPA chuẩn.',
          primaryCourse: {
            code: 'IELTS-LOST',
            title: 'IELTS Mất Gốc & Phát Âm Chuẩn Quốc Tế (0 - 3.5)',
            targetLevel: '3.5 - 4.5',
            tuitionFee: 4500000,
            durationWeeks: 8,
            badge: 'TỐI ƯU NHẤT CHO BẠN',
            description:
              'Khóa học được thiết kế dành riêng cho người mất gốc tiếng Anh hoàn toàn hoặc muốn xây dựng lại nền tảng phát âm IPA và ngữ pháp học thuật cốt lõi.',
            whyRecommended:
              'Điểm số của bạn phản ánh cần lấy lại gốc tiếng Anh, chuẩn hóa 44 âm IPA và 12 thì cơ bản trước khi luyện thi IELTS.',
            highlights: [
              'Chuẩn hóa 44 âm IPA theo giọng Anh - Mỹ chuẩn quốc tế',
              'Nắm chắc 12 chủ điểm ngữ pháp hay gặp nhất trong IELTS',
              'Tích lũy 1.500 từ vựng đời sống và học thuật nền tảng',
              'Cam kết tăng ít nhất 1.0 Band điểm sau 8 tuần học',
            ],
          },
          secondaryCourses: [
            {
              code: 'IELTS-PRE',
              title: 'IELTS Pre - Làm Quen Format Đề Thi Chuẩn (3.5 - 4.5)',
              targetLevel: '4.5 - 5.5',
              tuitionFee: 5800000,
              durationWeeks: 10,
              badge: 'BƯỚC TIẾP THEO',
              description: 'Khóa học kế tiếp sau khi hoàn thành nền tảng cơ bản.',
              whyRecommended: 'Lộ trình phát triển tự nhiên sau khóa Mất gốc.',
              highlights: ['Làm quen format đề thi chuẩn 4 kỹ năng', 'Rèn luyện Skimming & Scanning'],
            },
          ],
        };
      } else if (score < 14) {
        return {
          predictedBand: 3.5,
          bandRange: '3.0 - 4.0',
          levelName: 'Sơ cấp IELTS (Elementary A2-B1)',
          summaryFeedback:
            'Bạn đã có nhận biết cơ bản về ngữ pháp và từ vựng thông dụng, nhưng cần làm quen với format đề thi chuẩn 4 kỹ năng và các dạng bài thi điển hình.',
          primaryCourse: {
            code: 'IELTS-PRE',
            title: 'IELTS Pre - Làm Quen Format Đề Thi Chuẩn (3.5 - 4.5)',
            targetLevel: '4.5 - 5.5',
            tuitionFee: 5800000,
            durationWeeks: 10,
            badge: 'TỐI ƯU NHẤT CHO BẠN',
            description:
              'Làm quen toàn diện với cấu trúc bài thi IELTS 4 kỹ năng (Nghe, Nói, Đọc, Viết) và các dạng bài thi điển hình theo chuẩn Cambridge.',
            whyRecommended:
              'Trình độ hiện tại rất thích hợp để bước vào giai đoạn tiếp cận format đề thi thực tế và các bẫy thông tin thường gặp.',
            highlights: [
              'Nắm rõ tiêu chí chấm điểm và format 4 kỹ năng IELTS',
              'Kỹ năng Skimming & Scanning định vị thông tin nhanh',
              'Luyện nói phản xạ Part 1 và miêu tả biểu đồ Task 1',
              'Làm quen bộ đề thi Cambridge cơ bản',
            ],
          },
          secondaryCourses: [
            {
              code: 'IELTS-FND',
              title: 'IELTS Foundation - Xây Dựng Chiến Thuật Làm Bài (4.5 - 5.5)',
              targetLevel: '5.5 - 6.5',
              tuitionFee: 7500000,
              durationWeeks: 12,
              badge: 'MỤC TIÊU TIẾP THEO',
              description: 'Chiến thuật giải quyết câu hỏi khó và mở rộng ý tưởng.',
              whyRecommended: 'Phù hợp khi bạn muốn đẩy nhanh tiến độ lên 5.5+.',
              highlights: ['Chiến thuật Yes/No/Not Given', 'Phát triển ý Speaking Part 2'],
            },
          ],
        };
      } else if (score < 19) {
        return {
          predictedBand: 4.5,
          bandRange: '4.0 - 5.0',
          levelName: 'Trung cấp / Pre-Intermediate B1',
          summaryFeedback:
            'Bạn có nền tảng ngữ pháp tương đối tốt nhưng còn mắc bẫy ở các câu hỏi đảo ngữ và từ vựng học thuật. Cần xây dựng chiến thuật làm bài bài bản.',
          primaryCourse: {
            code: 'IELTS-FND',
            title: 'IELTS Foundation - Xây Dựng Chiến Thuật Làm Bài (4.5 - 5.5)',
            targetLevel: '5.5 - 6.5',
            tuitionFee: 7500000,
            durationWeeks: 12,
            badge: 'TỐI ƯU NHẤT CHO BẠN',
            description:
              'Tập trung bồi dưỡng chiến thuật xử lý các dạng câu hỏi khó trong bài thi IELTS, phát triển tư duy mở rộng ý tưởng Speaking Part 2 và Writing Task 2.',
            whyRecommended:
              'Bạn đã sẵn sàng để bứt phá lên mốc 5.5 - 6.5+, học phương pháp tư duy lập luận và làm chủ các dạng câu hỏi hóc búa.',
            highlights: [
              'Làm chủ dạng bài True/False/Not Given và Matching Headings',
              'Kỹ thuật phát triển đoạn văn chuẩn PEEL trong Writing Task 2',
              'Luyện phản xạ Speaking Part 2 theo công thức 5W1H',
              'Thi thử trực tiếp trên máy tính tại phòng Lab EduCenter',
            ],
          },
          secondaryCourses: [
            {
              code: 'IELTS-INT',
              title: 'IELTS Bứt Phá - Chinh Phục Band Điểm Vàng (5.5 - 6.5+)',
              targetLevel: '6.5 - 7.5+',
              tuitionFee: 9200000,
              durationWeeks: 12,
              badge: 'KHÓA HỌC BỨT PHÁ',
              description: 'Khóa học được học viên lựa chọn nhiều nhất tại EduCenter.',
              whyRecommended: 'Nếu mục tiêu của bạn là 6.5+ để nộp hồ sơ Đại học sớm.',
              highlights: ['Chinh phục Band 7.0+ Reading & Listening', 'Sửa bài 1:1 hàng tuần'],
            },
          ],
        };
      } else {
        return {
          predictedBand: 5.5,
          bandRange: '5.0 - 6.0',
          levelName: 'Khá / Intermediate B1-B2',
          summaryFeedback:
            'Xuất sắc! Bạn nắm chắc ngữ pháp cốt lõi và có vốn từ vựng học thuật tốt. Đây là thời điểm vàng để bứt phá lên mốc 6.5+ với các kỹ năng chuyên sâu.',
          primaryCourse: {
            code: 'IELTS-INT',
            title: 'IELTS Bứt Phá - Chinh Phục Band Điểm Vàng (5.5 - 6.5+)',
            targetLevel: '6.5 - 7.5+',
            tuitionFee: 9200000,
            durationWeeks: 12,
            badge: 'TỐI ƯU NHẤT CHO BẠN',
            description:
              'Khóa học được học viên lựa chọn nhiều nhất tại EduCenter! Cam kết tăng 1.0 Band điểm, đạt chuẩn nộp hồ sơ xét tuyển Đại học top đầu và du học quốc tế.',
            whyRecommended:
              'Giúp bạn bứt phá từ mốc 5.5 - 6.0 lên 6.5 - 7.5+, củng cố từ vựng Collocations học thuật và chiến thuật xử lý đề thi thật.',
            highlights: [
              'Chinh phục Band 7.0+ ở 2 kỹ năng Listening & Reading',
              'Sử dụng linh hoạt Collocations & Idiomatic language trong Speaking',
              'Nâng cấp cấu trúc ngữ pháp phức trong Writing Task 2',
              'Sửa bài 1:1 hàng tuần trực tiếp với giảng viên 8.5+',
            ],
          },
          secondaryCourses: [
            {
              code: 'IELTS-MST',
              title: 'IELTS Master 8.0+ - Luyện Cùng Giảng Viên 9.0 IELTS',
              targetLevel: '8.0+',
              tuitionFee: 12500000,
              durationWeeks: 10,
              badge: 'MỤC TIÊU XUẤT SẮC',
              description: 'Khóa học đỉnh cao cùng cựu giám khảo chấm thi.',
              whyRecommended: 'Lựa chọn hoàn hảo khi muốn vươn tới mốc điểm 7.5 - 8.0+.',
              highlights: ['Luyện đề Cambridge nâng cao', 'Coaching 1:1 chuyên sâu'],
            },
          ],
        };
      }
    },
  },

  // =========================================================================
  // BÀI TEST 2: IELTS Academic Reading Real Test (Đọc hiểu Học thuật Dài Thật)
  // =========================================================================
  {
    id: 'ielts-reading-real-02',
    title: 'IELTS Academic Reading Real Test - Đọc Hiểu Học Thuật Thực Chiến',
    subtitle: 'Đề thi thật Cambridge IELTS 16-19 • Đo lường khả năng đọc hiểu & bẫy học thuật (Band 5.0 - 7.5+)',
    category: 'Đề thi thật Reading',
    targetLevel: 'Band 5.0 - 7.5+',
    durationMinutes: 40,
    totalQuestions: 28,
    difficulty: 'Trung cấp - Khá',
    bannerUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop',
    description:
      'Đề thi đọc hiểu học thuật thực chiến trích xuất từ ngân hàng đề thi thật Cambridge IELTS. Thử thách kỹ năng đọc lướt, định vị từ khóa tinh vi, dạng bài True/False/Not Given, Matching Headings và Multiple Choice.',
    instructions: [
      'Bài thi gồm 2 bài đọc dài chuẩn học thuật (Passages 1 & 2) với 28 câu hỏi.',
      'Thời gian làm bài quy định: 40 phút.',
      'Sử dụng bảng đọc bên trái để xem bài đọc và danh sách câu hỏi bên phải để trả lời.',
      'Đọc kỹ hướng dẫn từng dạng câu hỏi (chú ý số lượng từ giới hạn).',
    ],
    passages: [
      {
        id: 'p2_roman',
        title: 'Passage 1: Roman Tunnel Engineering',
        subtitle: 'The Ingenuity of Ancient Subterranean Architecture',
        content: `Paragraph A\nThe Romans were celebrated master builders of antiquity, and among their most impressive civil engineering achievements were subterranean tunnels. These tunnels were excavated for diverse purposes: supplying water to expanding metropolises via aqueducts, draining lakes to create arable farmland, and creating roads through mountainous terrain. The Roman military played a paramount role in the construction of these underground conduits, providing both logistical organization and skilled manpower.\n\nParagraph B\nTwo distinct excavation methodologies were utilized by Roman engineers depending on geological conditions. The first and most pervasive technique was known as the qanat method, adapted from ancient Persian engineering. This approach was predominantly employed for tunneling through soft earth and level terrain. Surveyors would first establish the intended route across the landscape. Subsequently, vertical shafts were dug straight down into the ground at regular intervals of thirty to fifty meters. Once these shafts reached the intended depth of the tunnel, miners began excavating horizontally in both directions from the bottom of each vertical pit until the underground sections converged.\n\nParagraph C\nThe vertical shafts in the qanat method served multiple crucial functions. Primarily, they allowed miners to extract excavated rock and soil up to the surface in buckets using pulleys. Secondly, they provided continuous ventilation and essential airflow to laborers working deep underground in suffocating conditions. Finally, they acted as indispensable surveying checkpoints: plumb lines suspended down the shafts allowed supervisors on the surface to verify that the subterranean tunneling remained straight and accurately aligned.\n\nParagraph D\nWhen excavating through solid rock mountains, however, the qanat method was technically impossible due to the immense depth of the mountain ridge. In such cases, Roman engineers resorted to the counter-excavation method. Miners started tunneling from opposite sides of the mountain simultaneously, with the objective of meeting in the middle. This required extraordinary mathematical precision. Aligning two subterranean bores without modern GPS or compasses was exceptionally hazardous. Errors frequently occurred when surveyors miscalculated geological angles, resulting in tunnels that bypassed each other entirely.\n\nParagraph E\nA famous inscription dating from 152 CE in Algeria commemorates the dramatic rescue of one such misaligned project. The Roman governor of Mauretania Caesariensis requested the intervention of Nonius Datus, a renowned military hydraulic engineer. Upon arrival, Datus discovered that the two tunneling crews had missed each other and had excavated parallel bores through the mountain. Datus swiftly corrected the surveying calculations, connected the divergent channels with a transverse cut, and brought the municipal aqueduct to fruition.`,
      },
      {
        id: 'p2_ai_health',
        title: 'Passage 2: The Integration of Artificial Intelligence in Contemporary Healthcare',
        subtitle: 'Opportunities, Algorithmic Pitfalls, and Ethical Dilemmas',
        content: `Paragraph A\nOver the past decade, deep learning algorithms and artificial intelligence (AI) have transcended experimental computer science laboratories to revolutionize clinical diagnosis. Trained on massive datasets comprising millions of radiological scans, histology slides, and electronic health records, diagnostic neural networks are now capable of identifying subtle pathological anomalies with precision that equals, and in some domains exceeds, senior medical consultants. In ophthalmology and dermatology, AI systems detect early-stage diabetic retinopathy and malignant melanoma with unprecedented sensitivity.\n\nParagraph B\nDespite these staggering breakthroughs, clinical adoption of artificial intelligence remains hampered by the notorious "black box" dilemma. Unlike human physicians who can articulate the deductive rationale behind a differential diagnosis, deep neural networks generate probabilistic outputs through millions of opaque matrix multiplications. This lack of interpretability generates acute anxiety among practicing clinicians, who bear ultimate legal and moral liability for patient outcomes. When an algorithm recommends an invasive surgical procedure or an experimental chemotherapy regimen, doctors are understandably reluctant to act upon advice that cannot be transparently audited.\n\nParagraph C\nFurthermore, algorithms are uniquely vulnerable to encoded demographic bias. Machine learning models inherently reflect the statistical properties of their training cohorts. Historically, clinical research trials have disproportionately enrolled white, male, affluent populations in industrialized nations. Consequently, when diagnostic algorithms trained on these unrepresentative datasets are deployed in diverse real-world clinics, their predictive accuracy deteriorates sharply among marginalized ethnic minorities and elderly women. Far from democratizing healthcare, biased algorithms risk exacerbating existing systemic health disparities.\n\nParagraph D\nData privacy presents another formidable obstacle. State-of-the-art medical models require colossal volumes of high-resolution biometric and genomic data for continual refinement. Tech conglomerates partnering with public hospitals have faced severe public scrutiny over the commercial exploitation and de-identification standards of confidential patient histories. Regulatory frameworks, such as the European Union’s AI Act, are imposing stringent mandates requiring synthetic data testing, explicit consent protocols, and algorithmic accountability mechanisms.\n\nParagraph E\nMedical ethicists emphasize that the optimal paradigm is not the wholesale replacement of medical doctors by autonomous machines, but rather "augmented intelligence." In this collaborative model, AI serves as an indefatigable analytical copilot, triaging routine diagnostic scans, flagging anomalous biomarkers, and summarizing clinical literature, thereby liberating overburdened physicians to cultivate the human core of medicine: empathetic communication, shared decision-making, and holistic patient care.`,
      },
    ],
    questions: [
      {
        id: 'r2_q1',
        questionNumber: 1,
        type: 'TRUE_FALSE_NOT_GIVEN',
        section: 'Passage 1: Questions 1 - 7 (True / False / Not Given)',
        passageId: 'p2_roman',
        questionText:
          'Roman military units were exclusively responsible for funding the construction of municipal aqueducts.',
        options: [
          { key: 'TRUE', text: 'TRUE - If the statement agrees with the information' },
          { key: 'FALSE', text: 'FALSE - If the statement contradicts the information' },
          { key: 'NOT GIVEN', text: 'NOT GIVEN - If there is no information on this' },
        ],
        correctAnswer: 'NOT GIVEN',
        explanation:
          'Đoạn A nói quân đội đóng vai trò quan trọng ("providing logistical organization and skilled manpower"), nhưng không hề đề cập đến việc họ "chịu trách nhiệm tài trợ độc quyền (exclusively responsible for funding)".',
        skill: 'Reading',
      },
      {
        id: 'r2_q2',
        questionNumber: 2,
        type: 'TRUE_FALSE_NOT_GIVEN',
        section: 'Passage 1: Questions 1 - 7 (True / False / Not Given)',
        passageId: 'p2_roman',
        questionText:
          'The qanat excavation method was originally invented by Roman civil engineers.',
        options: [
          { key: 'TRUE', text: 'TRUE - If the statement agrees with the information' },
          { key: 'FALSE', text: 'FALSE - If the statement contradicts the information' },
          { key: 'NOT GIVEN', text: 'NOT GIVEN - If there is no information on this' },
        ],
        correctAnswer: 'FALSE',
        explanation:
          'Đoạn B nói phương pháp qanat "adapted from ancient Persian engineering" (được tiếp thu từ kỹ thuật Ba Tư cổ đại), chứ không phải do kỹ sư La Mã phát minh.',
        skill: 'Reading',
      },
      {
        id: 'r2_q3',
        questionNumber: 3,
        type: 'TRUE_FALSE_NOT_GIVEN',
        section: 'Passage 1: Questions 1 - 7 (True / False / Not Given)',
        passageId: 'p2_roman',
        questionText:
          'Vertical shafts in the qanat method were excavated after the underground horizontal tunnel had been completed.',
        options: [
          { key: 'TRUE', text: 'TRUE - If the statement agrees with the information' },
          { key: 'FALSE', text: 'FALSE - If the statement contradicts the information' },
          { key: 'NOT GIVEN', text: 'NOT GIVEN - If there is no information on this' },
        ],
        correctAnswer: 'FALSE',
        explanation:
          'Đoạn B khẳng định: "Subsequently, vertical shafts were dug straight down... Once these shafts reached the intended depth, miners began excavating horizontally". Các giếng đứng được đào TRƯỚC, sau đó mới đào ngang.',
        skill: 'Reading',
      },
      {
        id: 'r2_q4',
        questionNumber: 4,
        type: 'TRUE_FALSE_NOT_GIVEN',
        section: 'Passage 1: Questions 1 - 7 (True / False / Not Given)',
        passageId: 'p2_roman',
        questionText:
          'Plumb lines were used to ensure the underground tunnel followed a straight trajectory.',
        options: [
          { key: 'TRUE', text: 'TRUE - If the statement agrees with the information' },
          { key: 'FALSE', text: 'FALSE - If the statement contradicts the information' },
          { key: 'NOT GIVEN', text: 'NOT GIVEN - If there is no information on this' },
        ],
        correctAnswer: 'TRUE',
        explanation:
          'Đoạn C nêu rõ: "plumb lines suspended down the shafts allowed supervisors on the surface to verify that the subterranean tunneling remained straight and accurately aligned."',
        skill: 'Reading',
      },
      {
        id: 'r2_q5',
        questionNumber: 5,
        type: 'TRUE_FALSE_NOT_GIVEN',
        section: 'Passage 1: Questions 1 - 7 (True / False / Not Given)',
        passageId: 'p2_roman',
        questionText:
          'The counter-excavation method involved drilling from four different directions simultaneously.',
        options: [
          { key: 'TRUE', text: 'TRUE - If the statement agrees with the information' },
          { key: 'FALSE', text: 'FALSE - If the statement contradicts the information' },
          { key: 'NOT GIVEN', text: 'NOT GIVEN - If there is no information on this' },
        ],
        correctAnswer: 'FALSE',
        explanation:
          'Đoạn D nêu: "Miners started tunneling from opposite sides of the mountain simultaneously" - tức là từ 2 phía đối diện, không phải từ 4 hướng.',
        skill: 'Reading',
      },
      {
        id: 'r2_q6',
        questionNumber: 6,
        type: 'TRUE_FALSE_NOT_GIVEN',
        section: 'Passage 1: Questions 1 - 7 (True / False / Not Given)',
        passageId: 'p2_roman',
        questionText:
          'Nonius Datus completely demolished both existing tunnels before excavating a brand new route.',
        options: [
          { key: 'TRUE', text: 'TRUE - If the statement agrees with the information' },
          { key: 'FALSE', text: 'FALSE - If the statement contradicts the information' },
          { key: 'NOT GIVEN', text: 'NOT GIVEN - If there is no information on this' },
        ],
        correctAnswer: 'FALSE',
        explanation:
          'Đoạn E nói Datus "connected the divergent channels with a transverse cut" (nối hai đường hầm chệch hướng lại bằng một đường cắt ngang), chứ không phá hủy làm lại từ đầu.',
        skill: 'Reading',
      },
      {
        id: 'r2_q7',
        questionNumber: 7,
        type: 'TRUE_FALSE_NOT_GIVEN',
        section: 'Passage 1: Questions 1 - 7 (True / False / Not Given)',
        passageId: 'p2_roman',
        questionText:
          'Roman engineers earned higher salaries than other contemporary craftsmen in the Mediterranean.',
        options: [
          { key: 'TRUE', text: 'TRUE - If the statement agrees with the information' },
          { key: 'FALSE', text: 'FALSE - If the statement contradicts the information' },
          { key: 'NOT GIVEN', text: 'NOT GIVEN - If there is no information on this' },
        ],
        correctAnswer: 'NOT GIVEN',
        explanation:
          'Trong toàn bộ bài đọc không có bất kỳ thông tin nào so sánh mức lương (salaries) của kỹ sư La Mã với các thợ thủ công khác.',
        skill: 'Reading',
      },
      {
        id: 'r2_q8',
        questionNumber: 8,
        type: 'MULTIPLE_CHOICE',
        section: 'Passage 1: Questions 8 - 14 (Multiple Choice & Vocabulary)',
        passageId: 'p2_roman',
        questionText:
          'Why could Roman engineers NOT utilize the qanat method when digging through rocky mountains?',
        options: [
          { key: 'A', text: 'The rock caused rapid deterioration of their iron pickaxes.' },
          { key: 'B', text: 'The depth of the mountain ridge rendered vertical shafts impossible.' },
          { key: 'C', text: 'Mountainous springs flooded the vertical pits too quickly.' },
          { key: 'D', text: 'Laborers refused to work inside high-altitude caves.' },
        ],
        correctAnswer: 'B',
        explanation:
          'Đoạn D nêu rõ: "When excavating through solid rock mountains, however, the qanat method was technically impossible due to the immense depth of the mountain ridge."',
        skill: 'Reading',
      },
      {
        id: 'r2_q9',
        questionNumber: 9,
        type: 'MULTIPLE_CHOICE',
        section: 'Passage 1: Questions 8 - 14 (Multiple Choice & Vocabulary)',
        passageId: 'p2_roman',
        questionText:
          'Which of the following was NOT mentioned as a function of vertical shafts in Paragraph C?',
        options: [
          { key: 'A', text: 'Facilitating extraction of dirt and broken rock' },
          { key: 'B', text: 'Supplying fresh oxygen to miners deep below' },
          { key: 'C', text: 'Serving as surveying benchmarks with plumb lines' },
          { key: 'D', text: 'Storing hydraulic construction equipment underground' },
        ],
        correctAnswer: 'D',
        explanation:
          'Các chức năng A, B, C đều được nhắc chi tiết trong đoạn C. Chức năng D ("storing hydraulic equipment") không hề được nhắc đến.',
        skill: 'Reading',
      },
      {
        id: 'r2_q10',
        questionNumber: 10,
        type: 'MULTIPLE_CHOICE',
        section: 'Passage 1: Questions 8 - 14 (Multiple Choice & Vocabulary)',
        passageId: 'p2_roman',
        questionText:
          'The word "paramount" in Paragraph A is closest in meaning to:',
        options: [
          { key: 'A', text: 'Supreme / Crucial' },
          { key: 'B', text: 'Minor / Marginal' },
          { key: 'C', text: 'Disastrous' },
          { key: 'D', text: 'Expensive' },
        ],
        correctAnswer: 'A',
        explanation:
          '"paramount role" mang nghĩa vai trò tối quan trọng, then chốt hàng đầu (supreme / of prime importance).',
        skill: 'Vocabulary',
      },
      {
        id: 'r2_q11',
        questionNumber: 11,
        type: 'MULTIPLE_CHOICE',
        section: 'Passage 1: Questions 8 - 14 (Multiple Choice & Vocabulary)',
        passageId: 'p2_roman',
        questionText:
          'The interval distance between vertical shafts in the qanat method was typically:',
        options: [
          { key: 'A', text: '10 to 20 meters' },
          { key: 'B', text: '30 to 50 meters' },
          { key: 'C', text: '100 to 200 meters' },
          { key: 'D', text: 'Over 500 meters' },
        ],
        correctAnswer: 'B',
        explanation:
          'Đoạn B nêu: "vertical shafts were dug straight down into the ground at regular intervals of thirty to fifty meters."',
        skill: 'Reading',
      },
      {
        id: 'r2_q12',
        questionNumber: 12,
        type: 'MULTIPLE_CHOICE',
        section: 'Passage 1: Questions 8 - 14 (Multiple Choice & Vocabulary)',
        passageId: 'p2_roman',
        questionText:
          'What historical evidence commemorated Nonius Datus’s engineering feat in Algeria?',
        options: [
          { key: 'A', text: 'A carved stone inscription dating from 152 CE' },
          { key: 'B', text: 'A handwritten letter on Egyptian papyrus' },
          { key: 'C', text: 'A bronze coin minted with his portrait' },
          { key: 'D', text: 'A marble statue located in central Rome' },
        ],
        correctAnswer: 'A',
        explanation:
          'Đoạn E nêu: "A famous inscription dating from 152 CE in Algeria commemorates the dramatic rescue of one such misaligned project."',
        skill: 'Reading',
      },
      {
        id: 'r2_q13',
        questionNumber: 13,
        type: 'MULTIPLE_CHOICE',
        section: 'Passage 1: Questions 8 - 14 (Multiple Choice & Vocabulary)',
        passageId: 'p2_roman',
        questionText:
          'The word "transverse" in Paragraph E describes a cut that is:',
        options: [
          { key: 'A', text: 'Crosswise / Connecting across' },
          { key: 'B', text: 'Completely vertical' },
          { key: 'C', text: 'Reversing backwards' },
          { key: 'D', text: 'Circular and decorative' },
        ],
        correctAnswer: 'A',
        explanation:
          '"transverse cut" là đường cắt ngang/chéo nối hai đường hầm song song với nhau (crosswise).',
        skill: 'Vocabulary',
      },
      {
        id: 'r2_q14',
        questionNumber: 14,
        type: 'MULTIPLE_CHOICE',
        section: 'Passage 1: Questions 8 - 14 (Multiple Choice & Vocabulary)',
        passageId: 'p2_roman',
        questionText:
          'What is the primary rhetorical focus of Passage 1 as a whole?',
        options: [
          { key: 'A', text: 'Comparing Roman and Persian military tactics' },
          { key: 'B', text: 'Examining the technical methods and challenges of Roman subterranean engineering' },
          { key: 'C', text: 'Criticizing the mathematical shortcomings of ancient surveyors' },
          { key: 'D', text: 'Documenting the decline of aqueducts across North Africa' },
        ],
        correctAnswer: 'B',
        explanation:
          'Bài viết phân tích các kỹ thuật đào hầm của La Mã (qanat, counter-excavation), chức năng và các thách thức đo đạc kèm giải pháp khắc phục.',
        skill: 'Critical Reasoning',
      },

      // Passage 2 questions
      {
        id: 'r2_q15',
        questionNumber: 15,
        type: 'MULTIPLE_CHOICE',
        section: 'Passage 2: Matching Headings (Paragraphs A - E)',
        passageId: 'p2_ai_health',
        questionText:
          'Which heading best matches Paragraph A of Passage 2?',
        options: [
          { key: 'A', text: 'High diagnostic sensitivity matching senior clinicians' },
          { key: 'B', text: 'The legal liabilities of machine malpractice' },
          { key: 'C', text: 'Commercial conflicts in European hospitals' },
          { key: 'D', text: 'The emotional bond between patients and doctors' },
        ],
        correctAnswer: 'A',
        explanation:
          'Đoạn A tập trung miêu tả độ nhạy chẩn đoán cao của AI trong nhãn khoa, da liễu và các lĩnh vực bệnh học tương đương các bác sĩ kỳ cựu.',
        skill: 'Critical Reasoning',
      },
      {
        id: 'r2_q16',
        questionNumber: 16,
        type: 'MULTIPLE_CHOICE',
        section: 'Passage 2: Matching Headings (Paragraphs A - E)',
        passageId: 'p2_ai_health',
        questionText:
          'Which heading best matches Paragraph B of Passage 2?',
        options: [
          { key: 'A', text: 'The "black box" dilemma and lack of clinical interpretability' },
          { key: 'B', text: 'Synthetic data testing under the EU AI Act' },
          { key: 'C', text: 'Empathetic bedside manners in digital clinics' },
          { key: 'D', text: 'Enrolling elderly female patients in trials' },
        ],
        correctAnswer: 'A',
        explanation:
          'Đoạn B mổ xẻ vấn đề hộp đen ("black box" dilemma), việc bác sĩ không thể diễn giải các phép tính xác suất của mạng nơ-ron dẫn đến sự e dè khi áp dụng.',
        skill: 'Critical Reasoning',
      },
      {
        id: 'r2_q17',
        questionNumber: 17,
        type: 'MULTIPLE_CHOICE',
        section: 'Passage 2: Matching Headings (Paragraphs A - E)',
        passageId: 'p2_ai_health',
        questionText:
          'Which heading best matches Paragraph C of Passage 2?',
        options: [
          { key: 'A', text: 'Encoded demographic bias and systemic health disparities' },
          { key: 'B', text: 'Revolutionizing diabetic retinopathy scans' },
          { key: 'C', text: 'Commercialization of medical records' },
          { key: 'D', text: 'Triaging routine administrative appointments' },
        ],
        correctAnswer: 'A',
        explanation:
          'Đoạn C giải thích hiện tượng thiên lệch mẫu đào tạo (demographic bias) khiến độ chính xác của AI sụt giảm nghiêm trọng đối với các nhóm thiểu số và phụ nữ cao tuổi.',
        skill: 'Critical Reasoning',
      },
      {
        id: 'r2_q18',
        questionNumber: 18,
        type: 'MULTIPLE_CHOICE',
        section: 'Passage 2: Matching Headings (Paragraphs A - E)',
        passageId: 'p2_ai_health',
        questionText:
          'Which heading best matches Paragraph D of Passage 2?',
        options: [
          { key: 'A', text: 'Patient data privacy concerns and emerging regulatory frameworks' },
          { key: 'B', text: 'The elimination of histological microscopic analysis' },
          { key: 'C', text: 'Replacing hospital executives with algorithmic managers' },
          { key: 'D', text: 'The financial collapse of pharmaceutical research' },
        ],
        correctAnswer: 'A',
        explanation:
          'Đoạn D phân tích rủi ro rò rỉ dữ liệu riêng tư của bệnh nhân và các quy định pháp lý như Đạo luật AI của EU.',
        skill: 'Critical Reasoning',
      },
      {
        id: 'r2_q19',
        questionNumber: 19,
        type: 'MULTIPLE_CHOICE',
        section: 'Passage 2: Matching Headings (Paragraphs A - E)',
        passageId: 'p2_ai_health',
        questionText:
          'Which heading best matches Paragraph E of Passage 2?',
        options: [
          { key: 'A', text: 'Augmented intelligence: AI as analytical copilot to human physicians' },
          { key: 'B', text: 'Autonomous robot surgeons replacing human operating teams' },
          { key: 'C', text: 'Mandatory chemotherapy protocols without physician oversight' },
          { key: 'D', text: 'The obsolescence of traditional medical universities' },
        ],
        correctAnswer: 'A',
        explanation:
          'Đoạn E đưa ra kết luận về mô hình lý tưởng: "augmented intelligence", trong đó AI là phi công phụ hỗ trợ để bác sĩ tập trung vào chăm sóc nhân văn.',
        skill: 'Critical Reasoning',
      },
      {
        id: 'r2_q20',
        questionNumber: 20,
        type: 'TRUE_FALSE_NOT_GIVEN',
        section: 'Passage 2: Questions 20 - 24 (Yes / No / Not Given)',
        passageId: 'p2_ai_health',
        questionText:
          'Deep learning neural networks explain the step-by-step logic behind their diagnoses as clearly as human doctors.',
        options: [
          { key: 'TRUE', text: 'TRUE / YES' },
          { key: 'FALSE', text: 'FALSE / NO' },
          { key: 'NOT GIVEN', text: 'NOT GIVEN' },
        ],
        correctAnswer: 'FALSE',
        explanation:
          'Đoạn B chỉ rõ: "Unlike human physicians who can articulate the deductive rationale behind a differential diagnosis, deep neural networks generate probabilistic outputs through millions of opaque matrix multiplications."',
        skill: 'Reading',
      },
      {
        id: 'r2_q21',
        questionNumber: 21,
        type: 'TRUE_FALSE_NOT_GIVEN',
        section: 'Passage 2: Questions 20 - 24 (Yes / No / Not Given)',
        passageId: 'p2_ai_health',
        questionText:
          'Historical medical trials have frequently over-represented white, affluent male populations.',
        options: [
          { key: 'TRUE', text: 'TRUE / YES' },
          { key: 'FALSE', text: 'FALSE / NO' },
          { key: 'NOT GIVEN', text: 'NOT GIVEN' },
        ],
        correctAnswer: 'TRUE',
        explanation:
          'Đoạn C khẳng định: "Historically, clinical research trials have disproportionately enrolled white, male, affluent populations in industrialized nations."',
        skill: 'Reading',
      },
      {
        id: 'r2_q22',
        questionNumber: 22,
        type: 'TRUE_FALSE_NOT_GIVEN',
        section: 'Passage 2: Questions 20 - 24 (Yes / No / Not Given)',
        passageId: 'p2_ai_health',
        questionText:
          'The European Union’s AI Act has completely banned AI diagnostic software in all public hospitals.',
        options: [
          { key: 'TRUE', text: 'TRUE / YES' },
          { key: 'FALSE', text: 'FALSE / NO' },
          { key: 'NOT GIVEN', text: 'NOT GIVEN' },
        ],
        correctAnswer: 'FALSE',
        explanation:
          'Đoạn D chỉ nói đạo luật này áp đặt các quy định nghiêm ngặt (synthetic data testing, consent protocols), chứ KHÔNG hề cấm hoàn toàn ("completely banned").',
        skill: 'Reading',
      },
      {
        id: 'r2_q23',
        questionNumber: 23,
        type: 'TRUE_FALSE_NOT_GIVEN',
        section: 'Passage 2: Questions 20 - 24 (Yes / No / Not Given)',
        passageId: 'p2_ai_health',
        questionText:
          'Most clinical physicians have completed certified programming degrees in computer science.',
        options: [
          { key: 'TRUE', text: 'TRUE / YES' },
          { key: 'FALSE', text: 'FALSE / NO' },
          { key: 'NOT GIVEN', text: 'NOT GIVEN' },
        ],
        correctAnswer: 'NOT GIVEN',
        explanation:
          'Bài đọc không hề đề cập đến việc hầu hết bác sĩ lâm sàng có bằng lập trình máy tính hay không.',
        skill: 'Reading',
      },
      {
        id: 'r2_q24',
        questionNumber: 24,
        type: 'MULTIPLE_CHOICE',
        section: 'Passage 2: Questions 24 - 28 (Comprehensive Analysis)',
        passageId: 'p2_ai_health',
        questionText:
          'In Paragraph E, the author uses the phrase "indefatigable analytical copilot" to suggest that AI:',
        options: [
          { key: 'A', text: 'Never tires while processing repetitive analytical tasks' },
          { key: 'B', text: 'Directs aircraft evacuations during medical emergencies' },
          { key: 'C', text: 'Disagrees constantly with senior medical directors' },
          { key: 'D', text: 'Is legally accountable for catastrophic patient deaths' },
        ],
        correctAnswer: 'A',
        explanation:
          '"indefatigable" có nghĩa là không biết mệt mỏi; AI có thể sàng lọc hàng ngàn hình ảnh chụp chiếu liên tục mà không suy giảm năng suất.',
        skill: 'Vocabulary',
      },
      {
        id: 'r2_q25',
        questionNumber: 25,
        type: 'MULTIPLE_CHOICE',
        section: 'Passage 2: Questions 24 - 28 (Comprehensive Analysis)',
        passageId: 'p2_ai_health',
        questionText:
          'According to Paragraph C, what consequence arises when diagnostic AI is deployed among minority groups?',
        options: [
          { key: 'A', text: 'Hospital budgets double immediately.' },
          { key: 'B', text: 'Its predictive accuracy drops sharply.' },
          { key: 'C', text: 'Patients reject any pharmaceutical interventions.' },
          { key: 'D', text: 'The neural network deletes its own training weights.' },
        ],
        correctAnswer: 'B',
        explanation:
          'Đoạn C nêu: "their predictive accuracy deteriorates sharply among marginalized ethnic minorities and elderly women."',
        skill: 'Reading',
      },
      {
        id: 'r2_q26',
        questionNumber: 26,
        type: 'MULTIPLE_CHOICE',
        section: 'Passage 2: Questions 24 - 28 (Comprehensive Analysis)',
        passageId: 'p2_ai_health',
        questionText:
          'The word "staggering" in Paragraph B is closest in meaning to:',
        options: [
          { key: 'A', text: 'Astonishing / Extraordinary' },
          { key: 'B', text: 'Unsteady / Stumbling' },
          { key: 'C', text: 'Dangerous' },
          { key: 'D', text: 'Inconsequential' },
        ],
        correctAnswer: 'A',
        explanation:
          '"staggering breakthroughs" mang nghĩa những đột phá kinh ngạc, phi thường (astonishing / mind-boggling).',
        skill: 'Vocabulary',
      },
      {
        id: 'r2_q27',
        questionNumber: 27,
        type: 'MULTIPLE_CHOICE',
        section: 'Passage 2: Questions 24 - 28 (Comprehensive Analysis)',
        passageId: 'p2_ai_health',
        questionText:
          'Why are clinicians reluctant to prescribe treatments recommended by deep neural networks?',
        options: [
          { key: 'A', text: 'Because software licences are too expensive for public healthcare systems.' },
          { key: 'B', text: 'Because they bear legal responsibility for decisions that cannot be transparently audited.' },
          { key: 'C', text: 'Because AI systems cannot produce color-printed charts.' },
          { key: 'D', text: 'Because patient consent forms cannot be stored electronically.' },
        ],
        correctAnswer: 'B',
        explanation:
          'Đoạn B nêu rõ: "clinicians, who bear ultimate legal and moral liability for patient outcomes... are understandably reluctant to act upon advice that cannot be transparently audited."',
        skill: 'Critical Reasoning',
      },
      {
        id: 'r2_q28',
        questionNumber: 28,
        type: 'MULTIPLE_CHOICE',
        section: 'Passage 2: Questions 24 - 28 (Comprehensive Analysis)',
        passageId: 'p2_ai_health',
        questionText:
          'According to medical ethicists in Paragraph E, what represents the "human core of medicine"?',
        options: [
          { key: 'A', text: 'Rapid algorithmic scan classification' },
          { key: 'B', text: 'Empathetic communication and holistic patient care' },
          { key: 'C', text: 'Negotiating pharmaceutical contracts with insurers' },
          { key: 'D', text: 'Auditing code lines in electronic databases' },
        ],
        correctAnswer: 'B',
        explanation:
          'Đoạn E chốt lại: "the human core of medicine: empathetic communication, shared decision-making, and holistic patient care."',
        skill: 'Reading',
      },
    ],
    getRecommendations: (score: number, _total: number) => {
      if (score <= 2) {
        return {
          predictedBand: 1.0,
          bandRange: '0.0 - 2.0',
          levelName: 'Mất gốc hoàn toàn (Non-User A1)',
          summaryFeedback:
            'Bạn chưa trả lời chính xác câu hỏi nào trong bài đọc học thuật Cambridge. Điểm số phản ánh bạn đang bị mất gốc tiếng Anh hoặc chưa từng tiếp cận từ vựng và văn bản học thuật. Đừng nản lòng, lộ trình Mất gốc tại EduCenter sẽ giúp bạn lấy lại nền tảng phát âm và từ vựng từ đầu.',
          primaryCourse: {
            code: 'IELTS-LOST',
            title: 'IELTS Mất Gốc & Phát Âm Chuẩn Quốc Tế (0 - 3.5)',
            targetLevel: '3.5 - 4.5',
            tuitionFee: 4500000,
            durationWeeks: 8,
            badge: 'TỐI ƯU NHẤT CHO BẠN',
            description:
              'Khóa học được thiết kế dành riêng cho người mất gốc tiếng Anh hoàn toàn hoặc muốn xây dựng lại nền tảng phát âm IPA và ngữ pháp học thuật cốt lõi.',
            whyRecommended:
              'Bạn cần bắt đầu lại từ con số 0, chuẩn hóa 44 âm IPA và 1.500 từ vựng căn bản trước khi thử thách các bài đọc học thuật dài.',
            highlights: [
              'Chuẩn hóa 44 âm IPA theo giọng Anh - Mỹ chuẩn quốc tế',
              'Nắm chắc 12 chủ điểm ngữ pháp hay gặp nhất trong IELTS',
              'Tích lũy 1.500 từ vựng đời sống và học thuật nền tảng',
              'Cam kết tăng ít nhất 1.0 Band điểm sau 8 tuần học',
            ],
          },
          secondaryCourses: [
            {
              code: 'IELTS-PRE',
              title: 'IELTS Pre - Làm Quen Format Đề Thi Chuẩn (3.5 - 4.5)',
              targetLevel: '4.5 - 5.5',
              tuitionFee: 5800000,
              durationWeeks: 10,
              badge: 'BƯỚC TIẾP THEO',
              description: 'Khóa học kế tiếp sau khi hoàn thành khóa Mất gốc.',
              whyRecommended: 'Lộ trình phát triển tự nhiên sau khi hoàn thành căn bản.',
              highlights: ['Làm quen format đề thi 4 kỹ năng', 'Rèn luyện Skimming & Scanning'],
            },
          ],
        };
      } else if (score < 7) {
        return {
          predictedBand: 2.5,
          bandRange: '2.0 - 3.0',
          levelName: 'Sơ khởi / Extremely Limited (A1-A2)',
          summaryFeedback:
            'Khả năng đọc hiểu tiếng Anh học thuật của bạn đang ở mức sơ khởi. Cần tích lũy thêm vốn từ vựng căn bản và làm quen với cấu trúc câu phức trước khi đọc văn bản dài.',
          primaryCourse: {
            code: 'IELTS-LOST',
            title: 'IELTS Mất Gốc & Phát Âm Chuẩn Quốc Tế (0 - 3.5)',
            targetLevel: '3.5 - 4.5',
            tuitionFee: 4500000,
            durationWeeks: 8,
            badge: 'TỐI ƯU NHẤT CHO BẠN',
            description:
              'Xây dựng lại nền tảng phát âm IPA, từ vựng đời sống và ngữ pháp học thuật cốt lõi từ đầu.',
            whyRecommended:
              'Điểm số dưới 7 câu cho thấy vốn từ vựng nền tảng còn mỏng, cần khóa Mất gốc để củng cố gốc rễ vững vàng.',
            highlights: [
              'Nắm chắc 12 thì cơ bản và từ loại',
              'Chuẩn hóa ngữ âm và nối âm',
              'Tích lũy từ vựng theo chủ đề quen thuộc',
            ],
          },
          secondaryCourses: [
            {
              code: 'IELTS-PRE',
              title: 'IELTS Pre - Làm Quen Format Đề Thi Chuẩn (3.5 - 4.5)',
              targetLevel: '4.5 - 5.5',
              tuitionFee: 5800000,
              durationWeeks: 10,
              badge: 'BƯỚC TIẾP THEO',
              description: 'Làm quen format đề thi Cambridge.',
              whyRecommended: 'Phù hợp khi bạn đã lấy lại được 70% ngữ pháp cơ bản.',
              highlights: ['Kỹ thuật Skimming & Scanning'],
            },
          ],
        };
      } else if (score < 12) {
        return {
          predictedBand: 3.5,
          bandRange: '3.0 - 4.0',
          levelName: 'Sơ cấp / Limited User (A2)',
          summaryFeedback:
            'Bạn bắt đầu định vị được một số từ khóa cơ bản nhưng còn gặp khó khăn lớn với bẫy True/False/Not Given và tốc độ đọc. Khóa Pre-IELTS sẽ giúp bạn làm quen format đề thi.',
          primaryCourse: {
            code: 'IELTS-PRE',
            title: 'IELTS Pre - Làm Quen Format Đề Thi Chuẩn (3.5 - 4.5)',
            targetLevel: '4.5 - 5.5',
            tuitionFee: 5800000,
            durationWeeks: 10,
            badge: 'TỐI ƯU NHẤT CHO BẠN',
            description:
              'Làm quen toàn diện với cấu trúc bài thi IELTS 4 kỹ năng và các dạng bài thi đọc hiểu điển hình theo chuẩn Cambridge.',
            whyRecommended:
              'Trình độ hiện tại rất thích hợp để bước vào giai đoạn tiếp cận format đề thi thực tế và các bẫy thông tin thường gặp.',
            highlights: [
              'Kỹ thuật Skimming & Scanning định vị từ khóa nhanh',
              'Phân biệt True/False/Not Given cơ bản',
              'Xây dựng vốn từ vựng học thuật 1.800 từ',
            ],
          },
          secondaryCourses: [
            {
              code: 'IELTS-FND',
              title: 'IELTS Foundation - Xây Dựng Chiến Thuật Làm Bài (4.5 - 5.5)',
              targetLevel: '5.5 - 6.5',
              tuitionFee: 7500000,
              durationWeeks: 12,
              badge: 'MỤC TIÊU TIẾP THEO',
              description: 'Chiến thuật giải quyết câu hỏi khó.',
              whyRecommended: 'Nếu bạn có khả năng tiếp thu nhanh và muốn đẩy nhanh tiến độ.',
              highlights: ['Làm chủ bài đọc dài', 'Chiến thuật Paraphrasing'],
            },
          ],
        };
      } else if (score < 17) {
        return {
          predictedBand: 4.5,
          bandRange: '4.0 - 5.0',
          levelName: 'Trung cấp / Pre-Intermediate B1',
          summaryFeedback:
            'Bạn gặp khó khăn với tốc độ đọc các đoạn văn học thuật dài và lượng từ vựng chuyên ngành C1. Cần rèn luyện thêm chiến thuật Skim & Scan và từ khóa tương đương (Paraphrasing).',
          primaryCourse: {
            code: 'IELTS-FND',
            title: 'IELTS Foundation - Xây Dựng Chiến Thuật Làm Bài (4.5 - 5.5)',
            targetLevel: '5.5 - 6.5',
            tuitionFee: 7500000,
            durationWeeks: 12,
            badge: 'TỐI ƯU NHẤT CHO BẠN',
            description:
              'Tập trung bồi dưỡng chiến thuật xử lý các dạng câu hỏi khó trong bài thi IELTS, phát triển tư duy mở rộng ý tưởng Speaking Part 2 và Writing Task 2.',
            whyRecommended:
              'Khóa học sẽ cung cấp phương pháp Skimming & Scanning chuẩn và ngân hàng từ vựng học thuật 2.500 từ theo chủ đề.',
            highlights: [
              'Thành thạo chiến thuật làm bài Reading cho dạng True/False/Not Given',
              'Làm chủ dạng bài Listening Section 3 - 4 thảo luận chuyên sâu',
              'Phát triển ý tưởng Speaking Part 2 theo công thức 5W1H',
              'Nắm chắc cấu trúc đoạn văn chuẩn PEEL trong Writing Task 2',
            ],
          },
          secondaryCourses: [
            {
              code: 'IELTS-PRE',
              title: 'IELTS Pre - Làm Quen Format Đề Thi Chuẩn (3.5 - 4.5)',
              targetLevel: '4.5 - 5.5',
              tuitionFee: 5800000,
              durationWeeks: 10,
              badge: 'LỰA CHỌN CỦNG CỐ',
              description: 'Nếu bạn cảm thấy cần củng cố thêm phát âm và ngữ pháp.',
              whyRecommended: 'Giúp xây dựng tự tin trước khi bước vào giải đề.',
              highlights: ['Làm quen format 4 kỹ năng', 'Học phí ưu đãi'],
            },
          ],
        };
      } else if (score < 22) {
        return {
          predictedBand: 6.0,
          bandRange: '5.5 - 6.5+',
          levelName: 'Khá / Upper-Intermediate B2',
          summaryFeedback:
            'Bạn có khả năng định vị thông tin khá tốt, nhưng đôi khi vẫn mắc bẫy ở các câu hỏi True/False/Not Given phức tạp và từ vựng trừu tượng mang tính suy luận ngầm.',
          primaryCourse: {
            code: 'IELTS-INT',
            title: 'IELTS Bứt Phá - Chinh Phục Band Điểm Vàng (5.5 - 6.5+)',
            targetLevel: '6.5 - 7.5+',
            tuitionFee: 9200000,
            durationWeeks: 12,
            badge: 'TỐI ƯU NHẤT CHO BẠN',
            description:
              'Khóa học được học viên lựa chọn nhiều nhất tại EduCenter! Cam kết tăng 1.0 Band điểm, đạt chuẩn nộp hồ sơ xét tuyển Đại học top đầu và du học quốc tế.',
            whyRecommended:
              'Khóa học này sẽ giúp bạn khắc phục hoàn toàn bẫy Reading và nâng cấp Writing & Speaking lên chuẩn Band 6.5 - 7.0+.',
            highlights: [
              'Chinh phục Band 7.0+ ở 2 kỹ năng Listening & Reading',
              'Sử dụng linh hoạt Collocations & Idiomatic language',
              'Nâng cấp cấu trúc ngữ pháp phức (Complex Sentences)',
              'Sửa bài Writing & Speaking 1:1 hàng tuần trực tiếp',
            ],
          },
          secondaryCourses: [
            {
              code: 'IELTS-MST',
              title: 'IELTS Master 8.0+ - Luyện Cùng Giảng Viên 9.0 IELTS',
              targetLevel: '8.0+',
              tuitionFee: 12500000,
              durationWeeks: 10,
              badge: 'MỤC TIÊU CAO HƠN',
              description: 'Dành cho học viên muốn tiến thẳng lên mục tiêu 7.5 - 8.0.',
              whyRecommended: 'Nếu bạn có nhiều thời gian và muốn đầu tư học thuật dài hạn.',
              highlights: ['Lập luận đa chiều', 'Giảng viên 9.0 trực tiếp hướng dẫn'],
            },
          ],
        };
      } else {
        return {
          predictedBand: 7.5,
          bandRange: '7.0 - 8.5+',
          levelName: 'Xuất sắc / Advanced C1-C2',
          summaryFeedback:
            'Năng lực đọc hiểu học thuật của bạn ở mức xuất sắc! Bạn xử lý mượt mà các bài đọc Cambridge dài, nắm bắt bẫy True/False/Not Given và phân tích tư duy phản biện tinh tế.',
          primaryCourse: {
            code: 'IELTS-MST',
            title: 'IELTS Master 8.0+ - Luyện Cùng Giảng Viên 9.0 IELTS',
            targetLevel: '8.0+',
            tuitionFee: 12500000,
            durationWeeks: 10,
            badge: 'TỐI ƯU NHẤT CHO BẠN',
            description:
              'Khóa học đỉnh cao dành cho học viên mục tiêu săn học bổng toàn phần du học Anh/Mỹ/Úc hoặc giảng dạy IELTS. Chấm chữa Writing & Speaking chi tiết từng từ.',
            whyRecommended:
              'Kỹ năng Đọc của bạn đã ở mức Band 7.5+, chỉ cần tối ưu hóa Writing Task 2 & Speaking cùng Giảng viên 9.0 để chạm mốc 8.0+ Overall.',
            highlights: [
              'Chạm mốc 8.5 - 9.0 Listening & Reading',
              'Chuyên đề Writing Task 2 Band 8.0+ lập luận sắc bén',
              'Coaching 1:1 Speaking cùng cựu giám khảo chấm thi',
              'Hệ thống thi thử mô phỏng 100% Computer-delivered IELTS Lab',
            ],
          },
          secondaryCourses: [
            {
              code: 'IELTS-SPK-VIP',
              title: 'IELTS 1:1 Speaking & Writing Coaching VIP',
              targetLevel: '8.0 - 8.5+',
              tuitionFee: 14500000,
              durationWeeks: 8,
              badge: 'CHUYÊN SÂU 1 KÈM 1',
              description: 'Coaching 1:1 trực tiếp với Master Trainer 8.5+.',
              whyRecommended: 'Phù hợp khi bạn cần thi gấp trong 1 - 2 tháng tới.',
              highlights: ['Luyện đề dự đoán Cambridge', 'Chấm bài không giới hạn số lượng'],
            },
          ],
        };
      }
    },
  },

  // =========================================================================
  // BÀI TEST 3: IELTS Full Band Predictor (Dự đoán Overall Band Toàn diện)
  // =========================================================================
  {
    id: 'ielts-comprehensive-predictor-03',
    title: 'IELTS Comprehensive Band Predictor - Dự Đoán Overall Band',
    subtitle: 'Đánh giá năng lực toàn diện 4 khía cạnh học thuật • Dự đoán chính xác Overall Band (Band 4.5 - 8.5+)',
    category: 'Dự đoán Band toàn diện',
    targetLevel: 'Band 4.5 - 8.5+',
    durationMinutes: 45,
    totalQuestions: 30,
    difficulty: 'Nâng cao - Chuyên sâu',
    bannerUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
    description:
      'Bài thi toàn diện phân hóa chuyên sâu kiểm tra vốn từ vựng học thuật cao cấp C1-C2, cấu trúc ngữ pháp đảo ngữ / phức hợp, đọc hiểu tư duy phản biện và phân tích tính liên kết logic trong bài viết học thuật.',
    instructions: [
      'Bài thi gồm 30 câu hỏi phân bổ qua 4 phần chuyên biệt, thời lượng: 45 phút.',
      'Bao gồm 1 bài đọc nghiên cứu nhận thức học thuật chuyên sâu.',
      'Kết quả trả về dự đoán Band điểm Overall IELTS (từ 4.5 đến 8.5+), phân tích điểm mạnh/yếu theo từng kỹ năng và gợi ý khóa học phù hợp nhất.',
      'Khuyến khích làm bài tại nơi yên tĩnh để phản ánh trung thực nhất năng lực bản thân.',
    ],
    passages: [
      {
        id: 'p3_neuro',
        title: 'Academic Reading: The Cognitive Architecture of Memory Consolidation',
        subtitle: 'Neuroplasticity and the Synaptic Mechanisms of Long-term Retention',
        content: `Paragraph A\nFor over a century, neuroscientists have investigated how ephemeral daily experiences are transmuted into enduring long-term memories. The prevailing theoretical consensus posits that memory formation is not a monolithic event, but rather a protracted, two-stage neurological process termed memory consolidation. The initial encoding phase takes place within the hippocampus, a seahorse-shaped structure situated in the medial temporal lobe. The hippocampus acts as a temporary index or holding buffer, binding together multimodal sensory inputs—visual images, auditory cues, and emotional valences—into a coherent experiential trace.\n\nParagraph B\nHowever, the synaptic connections established in the hippocampus remain inherently fragile and susceptible to retrograde interference. Permanent retention necessitates systems consolidation: the gradual, time-dependent reorganization whereby the mnemonic representation is progressively transferred from the hippocampus to the neocortex. During periods of slow-wave sleep, high-frequency electrical bursts known as "sharp-wave ripples" emanate from the hippocampus, reactivating the newly acquired neural assemblies. This nocturnal dialogue coordinates the slow, synchronized rewiring of neocortical synapses, effectively hardwiring the memory into distributed associative networks.\n\nParagraph C\nRecent breakthroughs in optogenetics have compelled researchers to revise this classical sequential paradigm. By selectively illuminating genetically tagged neurons in animal models, scientists discovered that cortical memory traces, or "engrams," are actually generated concurrently with hippocampal engrams during initial learning. Initially, however, these cortical engrams remain "silent" or retrieval-incompetent. Only as the hippocampal trace gradually fades over weeks of sleep-dependent synaptic reinforcement does the cortical engram mature into an active state capable of autonomous recall without hippocampal mediation.\n\nParagraph D\nThis dual-trace architecture confers a profound evolutionary advantage. The transient hippocampal buffer enables organisms to absorb unexpected, highly specific environmental information instantaneously without destabilizing pre-existing conceptual knowledge. Conversely, the slow neocortical consolidation mechanism extracts statistical regularities and generalized schemas from recurring experiences over time, immunizing the organism against catastrophic forgetting. Understanding these delicate synaptic dynamics holds vital promise for developing therapeutic interventions against Alzheimer’s disease, traumatic brain injury, and age-related cognitive decline.`,
      },
    ],
    questions: [
      {
        id: 'c3_q1',
        questionNumber: 1,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 1: C1-C2 Academic Lexicon & Collocations',
        questionText:
          'The empirical data collected from the randomized trial failed to _______ the researcher’s primary hypothesis.',
        options: [
          { key: 'A', text: 'corroborate' },
          { key: 'B', text: 'collaborate' },
          { key: 'C', text: 'commemorate' },
          { key: 'D', text: 'correlate' },
        ],
        correctAnswer: 'A',
        explanation:
          '"corroborate a hypothesis/claim" là collocation C2 chuẩn mang nghĩa chứng thực, củng cố tính xác thực của giả thuyết bằng chứng cứ thực nghiệm.',
        skill: 'Vocabulary',
      },
      {
        id: 'c3_q2',
        questionNumber: 2,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 1: C1-C2 Academic Lexicon & Collocations',
        questionText:
          'Rapid urbanization without adequate sanitation infrastructure will inevitably _______ the risk of waterborne epidemics.',
        options: [
          { key: 'A', text: 'exacerbate' },
          { key: 'B', text: 'alleviate' },
          { key: 'C', text: 'ameliorate' },
          { key: 'D', text: 'attenuate' },
        ],
        correctAnswer: 'A',
        explanation:
          '"exacerbate" (làm trầm trọng thêm) đối lập hoàn toàn với alleviate/ameliorate (làm dịu đi/cải thiện). Ngữ cảnh đô thị hóa thiếu hạ tầng vệ sinh sẽ làm trầm trọng thêm nguy cơ dịch bệnh.',
        skill: 'Vocabulary',
      },
      {
        id: 'c3_q3',
        questionNumber: 3,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 1: C1-C2 Academic Lexicon & Collocations',
        questionText:
          'The link between excessive social media consumption and adolescent depression is described by some critics as _______ at best.',
        options: [
          { key: 'A', text: 'tenuous' },
          { key: 'B', text: 'robust' },
          { key: 'C', text: 'impervious' },
          { key: 'D', text: 'conclusive' },
        ],
        correctAnswer: 'A',
        explanation:
          '"tenuous link/connection" là cụm từ học thuật diễn tả mối liên hệ mong manh, thiếu vững chắc, mơ hồ.',
        skill: 'Vocabulary',
      },
      {
        id: 'c3_q4',
        questionNumber: 4,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 1: C1-C2 Academic Lexicon & Collocations',
        questionText:
          'The candidate’s argument was undermined by a _______ of factual evidence and contradictory statistical citations.',
        options: [
          { key: 'A', text: 'dearth' },
          { key: 'B', text: 'surfeit' },
          { key: 'C', text: 'plethora' },
          { key: 'D', text: 'redundancy' },
        ],
        correctAnswer: 'A',
        explanation:
          '"a dearth of evidence" mang nghĩa sự khan hiếm, thiếu thốn trầm trọng bằng chứng thực tế (dearth = scarcity).',
        skill: 'Vocabulary',
      },
      {
        id: 'c3_q5',
        questionNumber: 5,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 1: C1-C2 Academic Lexicon & Collocations',
        questionText:
          'The government’s new environmental sanctions are expected to have a _______ effect on corporate carbon emissions.',
        options: [
          { key: 'A', text: 'salutary' },
          { key: 'B', text: 'detrimental' },
          { key: 'C', text: 'deleterious' },
          { key: 'D', text: 'superficial' },
        ],
        correctAnswer: 'A',
        explanation:
          '"salutary effect" nghĩa là hiệu ứng bổ ích, có lợi (beneficial / wholesome effect), đặc biệt sau một cảnh báo hoặc biện pháp trừng phạt.',
        skill: 'Vocabulary',
      },
      {
        id: 'c3_q6',
        questionNumber: 6,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 1: C1-C2 Academic Lexicon & Collocations',
        questionText:
          'Her dissertation demonstrates an _______ grasp of sociolinguistic variations in multilingual metropolitan areas.',
        options: [
          { key: 'A', text: 'astute' },
          { key: 'B', text: 'obtuse' },
          { key: 'C', text: 'archaic' },
          { key: 'D', text: 'abrupt' },
        ],
        correctAnswer: 'A',
        explanation:
          '"astute grasp / astute observation" thể hiện sự sắc sảo, tinh tế và sâu sắc (shrewd and perceptive).',
        skill: 'Vocabulary',
      },
      {
        id: 'c3_q7',
        questionNumber: 7,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 1: C1-C2 Academic Lexicon & Collocations',
        questionText:
          'Rather than settling the dispute, the committee’s vague communique served only to _______ existing grievances.',
        options: [
          { key: 'A', text: 'fuel' },
          { key: 'B', text: 'quench' },
          { key: 'C', text: 'douse' },
          { key: 'D', text: 'stifle' },
        ],
        correctAnswer: 'A',
        explanation:
          'Idiom học thuật: "fuel grievances / fuel tensions" nghĩa là thổi bùng thêm, làm gia tăng mâu thuẫn bức xúc.',
        skill: 'Vocabulary',
      },
      {
        id: 'c3_q8',
        questionNumber: 8,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 1: C1-C2 Academic Lexicon & Collocations',
        questionText:
          'Economic indicators suggest that inflation has reached its peak and is now beginning to _______ gradually.',
        options: [
          { key: 'A', text: 'subside' },
          { key: 'B', text: 'ascend' },
          { key: 'C', text: 'proliferate' },
          { key: 'D', text: 'escalate' },
        ],
        correctAnswer: 'A',
        explanation:
          '"subside" nghĩa là lắng xuống, giảm dần cường độ (become less intense or severe).',
        skill: 'Vocabulary',
      },
      {
        id: 'c3_q9',
        questionNumber: 9,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 2: Advanced Syntax & Grammar in Academic Writing',
        questionText:
          'Not until the peer review process _______ did the editors discover the discrepancies in the statistical modeling.',
        options: [
          { key: 'A', text: 'was concluded' },
          { key: 'B', text: 'had concluded' },
          { key: 'C', text: 'concluding' },
          { key: 'D', text: 'has concluded' },
        ],
        correctAnswer: 'B',
        explanation:
          'Cấu trúc đảo ngữ "Not until + Clause (Past Perfect / Past), did + S + V nguyên thể". Mệnh đề phụ đi sau not until thể hiện hành động diễn ra trước nên dùng Past Perfect (had concluded).',
        skill: 'Grammar',
      },
      {
        id: 'c3_q10',
        questionNumber: 10,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 2: Advanced Syntax & Grammar in Academic Writing',
        questionText:
          '_______ had the policy been enacted when international currency speculators began withdrawing capital.',
        options: [
          { key: 'A', text: 'Hardly' },
          { key: 'B', text: 'No sooner' },
          { key: 'C', text: 'Scarcely' },
          { key: 'D', text: 'Barely' },
        ],
        correctAnswer: 'A',
        explanation:
          'Cấu trúc "Hardly / Scarcely + had + S + V3... when...". (Lưu ý: "No sooner" phải đi kèm với "than", không đi với "when").',
        skill: 'Grammar',
      },
      {
        id: 'c3_q11',
        questionNumber: 11,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 2: Advanced Syntax & Grammar in Academic Writing',
        questionText:
          '_______ from a holistic perspective, the urban regeneration initiative succeeded in curtailing juvenile delinquency.',
        options: [
          { key: 'A', text: 'Viewed' },
          { key: 'B', text: 'Viewing' },
          { key: 'C', text: 'Having viewed' },
          { key: 'D', text: 'To view' },
        ],
        correctAnswer: 'A',
        explanation:
          'Rút gọn mệnh đề phân từ bị động (Past Participle clause): "(When it was) Viewed from a holistic perspective, the initiative succeeded...". Chủ ngữ của mệnh đề chính là "the urban regeneration initiative" (được nhìn nhận).',
        skill: 'Grammar',
      },
      {
        id: 'c3_q12',
        questionNumber: 12,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 2: Advanced Syntax & Grammar in Academic Writing',
        questionText:
          'Were the central bank _______ interest rates prematurely, consumer spending would experience a sharp contraction.',
        options: [
          { key: 'A', text: 'to raise' },
          { key: 'B', text: 'raises' },
          { key: 'C', text: 'raising' },
          { key: 'D', text: 'raised' },
        ],
        correctAnswer: 'A',
        explanation:
          'Đảo ngữ câu điều kiện loại 2 với động từ thường: "Were + S + to-V": "Were the central bank to raise interest rates...".',
        skill: 'Grammar',
      },
      {
        id: 'c3_q13',
        questionNumber: 13,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 2: Advanced Syntax & Grammar in Academic Writing',
        questionText:
          'The Dean recommended that the ethical review board _______ an independent inquiry into the laboratory protocols.',
        options: [
          { key: 'A', text: 'conduct' },
          { key: 'B', text: 'conducts' },
          { key: 'C', text: 'conducted' },
          { key: 'D', text: 'has conducted' },
        ],
        correctAnswer: 'A',
        explanation:
          'Thể giả định sau động từ "recommend that + S + (should) + V (nguyên thể không chia)": conduct.',
        skill: 'Grammar',
      },
      {
        id: 'c3_q14',
        questionNumber: 14,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 2: Advanced Syntax & Grammar in Academic Writing',
        questionText:
          'What distinguishes nominalization in academic writing is its capacity to _______ complex clauses into concise noun phrases.',
        options: [
          { key: 'A', text: 'condense' },
          { key: 'B', text: 'dilate' },
          { key: 'C', text: 'diffuse' },
          { key: 'D', text: 'scatter' },
        ],
        correctAnswer: 'A',
        explanation:
          '"condense complex clauses into concise noun phrases" nghĩa là cô đọng, súc tích hóa các mệnh đề phức thành các cụm danh từ học thuật.',
        skill: 'Critical Reasoning',
      },
      {
        id: 'c3_q15',
        questionNumber: 15,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 2: Advanced Syntax & Grammar in Academic Writing',
        questionText:
          'So intense _______ the public scrutiny surrounding the clinical trial that several researchers resigned.',
        options: [
          { key: 'A', text: 'was' },
          { key: 'B', text: 'did' },
          { key: 'C', text: 'had' },
          { key: 'D', text: 'has' },
        ],
        correctAnswer: 'A',
        explanation:
          'Cấu trúc đảo ngữ với "So + Adj + be + S + that...": "So intense was the public scrutiny... that...".',
        skill: 'Grammar',
      },

      // Passage 3 Questions
      {
        id: 'c3_q16',
        questionNumber: 16,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 3: Critical Academic Reading',
        passageId: 'p3_neuro',
        questionText:
          'In Paragraph A, the author characterizes memory formation as a "two-stage neurological process" to emphasize that:',
        options: [
          { key: 'A', text: 'Memories are created instantaneously in a single cerebral location.' },
          { key: 'B', text: 'Retention involves a protracted transition from initial encoding to permanent storage.' },
          { key: 'C', text: 'Human brains reject more than half of daily visual stimuli.' },
          { key: 'D', text: 'Memory retrieval is dependent strictly upon conscious verbal rehearsal.' },
        ],
        correctAnswer: 'B',
        explanation:
          'Đoạn A khẳng định hình thành trí nhớ không phải là sự kiện đơn nhất ("not a monolithic event"), mà là một quá trình kéo dài ("protracted, two-stage neurological process").',
        skill: 'Reading',
      },
      {
        id: 'c3_q17',
        questionNumber: 17,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 3: Critical Academic Reading',
        passageId: 'p3_neuro',
        questionText:
          'According to Paragraph A, what role does the hippocampus play during the initial encoding phase?',
        options: [
          { key: 'A', text: 'It permanently insulates synapses against environmental neurotoxins.' },
          { key: 'B', text: 'It acts as a temporary index binding diverse sensory inputs into a coherent trace.' },
          { key: 'C', text: 'It suppresses neocortical electrical activity during waking consciousness.' },
          { key: 'D', text: 'It translates linguistic vocabulary into mathematical equations.' },
        ],
        correctAnswer: 'B',
        explanation:
          'Đoạn A nêu: "The hippocampus acts as a temporary index or holding buffer, binding together multimodal sensory inputs... into a coherent experiential trace."',
        skill: 'Reading',
      },
      {
        id: 'c3_q18',
        questionNumber: 18,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 3: Critical Academic Reading',
        passageId: 'p3_neuro',
        questionText:
          'What nocturnal phenomenon in Paragraph B is instrumental in coordinating systems consolidation?',
        options: [
          { key: 'A', text: 'Rapid eye movement dream narratives' },
          { key: 'B', text: 'High-frequency electrical bursts known as sharp-wave ripples' },
          { key: 'C', text: 'Sudden surges in cortisol hormone secretion' },
          { key: 'D', text: 'Voluntary motor muscle twitching during light sleep' },
        ],
        correctAnswer: 'B',
        explanation:
          'Đoạn B nêu rõ: "During periods of slow-wave sleep, high-frequency electrical bursts known as sharp-wave ripples emanate from the hippocampus, reactivating newly acquired neural assemblies."',
        skill: 'Reading',
      },
      {
        id: 'c3_q19',
        questionNumber: 19,
        type: 'TRUE_FALSE_NOT_GIVEN',
        section: 'Part 3: Critical Academic Reading (Yes / No / Not Given)',
        passageId: 'p3_neuro',
        questionText:
          'Optogenetic experiments demonstrated that cortical engrams are created only weeks after hippocampal engrams have vanished.',
        options: [
          { key: 'TRUE', text: 'TRUE / YES' },
          { key: 'FALSE', text: 'FALSE / NO' },
          { key: 'NOT GIVEN', text: 'NOT GIVEN' },
        ],
        correctAnswer: 'FALSE',
        explanation:
          'Đoạn C phủ định điều này: "scientists discovered that cortical memory traces, or engrams, are actually generated concurrently with hippocampal engrams during initial learning" (được tạo đồng thời, ban đầu ở trạng thái silent).',
        skill: 'Reading',
      },
      {
        id: 'c3_q20',
        questionNumber: 20,
        type: 'TRUE_FALSE_NOT_GIVEN',
        section: 'Part 3: Critical Academic Reading (Yes / No / Not Given)',
        passageId: 'p3_neuro',
        questionText:
          'Initially, newly generated cortical engrams are capable of autonomous memory recall.',
        options: [
          { key: 'TRUE', text: 'TRUE / YES' },
          { key: 'FALSE', text: 'FALSE / NO' },
          { key: 'NOT GIVEN', text: 'NOT GIVEN' },
        ],
        correctAnswer: 'FALSE',
        explanation:
          'Đoạn C nêu: "Initially, however, these cortical engrams remain silent or retrieval-incompetent." (không có khả năng truy xuất độc lập ban đầu).',
        skill: 'Reading',
      },
      {
        id: 'c3_q21',
        questionNumber: 21,
        type: 'TRUE_FALSE_NOT_GIVEN',
        section: 'Part 3: Critical Academic Reading (Yes / No / Not Given)',
        passageId: 'p3_neuro',
        questionText:
          'Optogenetic equipment is currently deployed in regular hospital treatments for human stroke victims.',
        options: [
          { key: 'TRUE', text: 'TRUE / YES' },
          { key: 'FALSE', text: 'FALSE / NO' },
          { key: 'NOT GIVEN', text: 'NOT GIVEN' },
        ],
        correctAnswer: 'NOT GIVEN',
        explanation:
          'Bài đọc chỉ nói nghiên cứu quang di truyền được thực hiện trên động vật ("in animal models"), không hề đề cập đến việc áp dụng điều trị người bị đột quỵ trong bệnh viện.',
        skill: 'Reading',
      },
      {
        id: 'c3_q22',
        questionNumber: 22,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 3: Critical Academic Reading',
        passageId: 'p3_neuro',
        questionText:
          'According to Paragraph D, what evolutionary benefit is conferred by the slow neocortical consolidation mechanism?',
        options: [
          { key: 'A', text: 'It allows the brain to completely erase childhood trauma within hours.' },
          { key: 'B', text: 'It extracts generalized schemas from recurring experiences, preventing catastrophic forgetting.' },
          { key: 'C', text: 'It accelerates physical muscle reflexes during acute predatory attacks.' },
          { key: 'D', text: 'It minimizes the hours of sleep required for biological survival.' },
        ],
        correctAnswer: 'B',
        explanation:
          'Đoạn D nêu rõ: "Conversely, the slow neocortical consolidation mechanism extracts statistical regularities and generalized schemas from recurring experiences over time, immunizing the organism against catastrophic forgetting."',
        skill: 'Critical Reasoning',
      },
      {
        id: 'c3_q23',
        questionNumber: 23,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 3: Critical Academic Reading',
        passageId: 'p3_neuro',
        questionText:
          'The word "ephemeral" in Paragraph A is closest in meaning to:',
        options: [
          { key: 'A', text: 'Fleeting / Transient' },
          { key: 'B', text: 'Permanent / Indelible' },
          { key: 'C', text: 'Painful' },
          { key: 'D', text: 'Inaccurate' },
        ],
        correctAnswer: 'A',
        explanation:
          '"ephemeral daily experiences" là những trải nghiệm hàng ngày ngắn ngủi, thoáng qua (fleeting / transient), đối lập với "enduring long-term memories".',
        skill: 'Vocabulary',
      },
      {
        id: 'c3_q24',
        questionNumber: 24,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 3: Critical Academic Reading',
        passageId: 'p3_neuro',
        questionText:
          'The word "immunizing" in Paragraph D metaphorically conveys the idea of:',
        options: [
          { key: 'A', text: 'Protecting / Shielding' },
          { key: 'B', text: 'Infecting' },
          { key: 'C', text: 'Diagnosing' },
          { key: 'D', text: 'Inoculating with a vaccine' },
        ],
        correctAnswer: 'A',
        explanation:
          '"immunizing the organism against catastrophic forgetting" mang nghĩa bảo vệ/che chắn cho não bộ khỏi sự lãng quên thảm khốc.',
        skill: 'Vocabulary',
      },
      {
        id: 'c3_q25',
        questionNumber: 25,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 3: Critical Academic Reading',
        passageId: 'p3_neuro',
        questionText:
          'What primary therapeutic potential of this research is highlighted in the final sentence?',
        options: [
          { key: 'A', text: 'Developing interventions against Alzheimer’s disease and cognitive decline' },
          { key: 'B', text: 'Synthesizing artificial electronic hippocampi for consumer smartphones' },
          { key: 'C', text: 'Replacing biological sleep with pharmaceutical stimulant drugs' },
          { key: 'D', text: 'Eradicating the necessity of academic schooling in children' },
        ],
        correctAnswer: 'A',
        explanation:
          'Câu cuối cùng: "Understanding these delicate synaptic dynamics holds vital promise for developing therapeutic interventions against Alzheimer’s disease, traumatic brain injury, and age-related cognitive decline."',
        skill: 'Reading',
      },

      // Part 4: Writing Cohesion & Logic Error Identification
      {
        id: 'c3_q26',
        questionNumber: 26,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 4: Writing Cohesion & Academic Logic',
        questionText:
          'Examine the following argument: "Every candidate who studied at EduCenter scored Band 7.5 or higher. Therefore, any student who scores Band 7.5 must have studied at EduCenter." What logical fallacy does this statement commit?',
        options: [
          { key: 'A', text: 'Affirming the consequent (Converse error)' },
          { key: 'B', text: 'Ad hominem attack' },
          { key: 'C', text: 'Bandwagon fallacy' },
          { key: 'D', text: 'Red herring' },
        ],
        correctAnswer: 'A',
        explanation:
          'Ngụy biện khẳng định hệ quả (Affirming the consequent): A -> B không có nghĩa là B -> A. Việc học viên EduCenter đạt 7.5+ không suy ra ai đạt 7.5+ cũng đều học tại EduCenter.',
        skill: 'Critical Reasoning',
      },
      {
        id: 'c3_q27',
        questionNumber: 27,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 4: Writing Cohesion & Academic Logic',
        questionText:
          'In academic IELTS Task 2, which of the following represents the most cohesive topic sentence for a paragraph discussing the economic repercussions of automation?',
        options: [
          { key: 'A', text: 'Robots are really taking people’s jobs away and making workers very sad.' },
          { key: 'B', text: 'From an economic standpoint, accelerated industrial automation poses substantial disruption to manual employment sectors.' },
          { key: 'C', text: 'Firstly, I will talk about how factories use machines nowadays in modern countries.' },
          { key: 'D', text: 'Machines have both good and bad things in the economy today.' },
        ],
        correctAnswer: 'B',
        explanation:
          'Câu B có cấu trúc câu chủ đề hoàn hảo: định vị góc nhìn học thuật ("From an economic standpoint"), dùng từ vựng Band cao ("accelerated industrial automation", "substantial disruption to manual employment sectors"), không mang tính kể lể hay cảm tính.',
        skill: 'Critical Reasoning',
      },
      {
        id: 'c3_q28',
        questionNumber: 28,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 4: Writing Cohesion & Academic Logic',
        questionText:
          'Choose the best sentence to conclude a PEEL (Point, Explanation, Evidence, Link) body paragraph on renewable energy subsidies:',
        options: [
          { key: 'A', text: 'Thus, targeted state subventions for green technology are indispensable to mitigating long-term ecological degradation.' },
          { key: 'B', text: 'And that is why governments should spend lots of money on wind turbines.' },
          { key: 'C', text: 'Nobody can deny that solar panels are good for our world.' },
          { key: 'D', text: 'In conclusion, I have demonstrated that my opinion is completely correct.' },
        ],
        correctAnswer: 'A',
        explanation:
          'Câu A hoàn tất chức năng "Link" của PEEL một cách xuất sắc: liên kết trở lại luận điểm trung tâm với văn phong học thuật trang trọng (subventions, indispensable, mitigating long-term ecological degradation).',
        skill: 'Critical Reasoning',
      },
      {
        id: 'c3_q29',
        questionNumber: 29,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 4: Writing Cohesion & Academic Logic',
        questionText:
          'Identify the sentence containing faulty parallel structure:',
        options: [
          { key: 'A', text: 'The academic preparation course aims to enhance analytical reading, refine essay composition, and cultivate critical thinking.' },
          { key: 'B', text: 'The curriculum emphasizes speaking fluently, writing accurately, and to listen attentively.' },
          { key: 'C', text: 'Applicants must submit their academic transcripts, provide two letters of recommendation, and complete an interview.' },
          { key: 'D', text: 'The program is rigorous, intellectually stimulating, and highly collaborative.' },
        ],
        correctAnswer: 'B',
        explanation:
          'Câu B vi phạm cấu trúc song song (parallel structure): "speaking fluently" (V-ing), "writing accurately" (V-ing) nhưng vế cuối lại đổi thành "to listen attentively" (to-V). Sửa thành: "and listening attentively".',
        skill: 'Grammar',
      },
      {
        id: 'c3_q30',
        questionNumber: 30,
        type: 'MULTIPLE_CHOICE',
        section: 'Part 4: Writing Cohesion & Academic Logic',
        questionText:
          'Which cohesive device is most appropriate to introduce an unexpected counter-argument conceded by the author?',
        options: [
          { key: 'A', text: 'Admittedly' },
          { key: 'B', text: 'In addition' },
          { key: 'C', text: 'Similarly' },
          { key: 'D', text: 'Namely' },
        ],
        correctAnswer: 'A',
        explanation:
          '"Admittedly" (Phải thừa nhận rằng...) là từ nối nhượng bộ (concession) kinh điển trong bài luận học thuật IELTS Band 8.0+ để công nhận một góc nhìn đối lập trước khi phản bác lại.',
        skill: 'Critical Reasoning',
      },
    ],
    getRecommendations: (score: number, _total: number) => {
      if (score <= 2) {
        return {
          predictedBand: 1.0,
          bandRange: '0.0 - 2.0',
          levelName: 'Mất gốc hoàn toàn (Non-User A1)',
          summaryFeedback:
            'Bạn chưa trả lời chính xác câu hỏi nào (hoặc đúng rất ít câu) trong bài đánh giá phân hóa năng lực toàn diện. Kết quả phản ánh bạn bị mất gốc tiếng Anh hoặc chưa từng tiếp cận từ vựng và tư duy học thuật. Khóa học "IELTS Mất Gốc & Phát Âm Chuẩn Quốc Tế" sẽ giúp bạn xây dựng lại nền tảng từ con số 0.',
          primaryCourse: {
            code: 'IELTS-LOST',
            title: 'IELTS Mất Gốc & Phát Âm Chuẩn Quốc Tế (0 - 3.5)',
            targetLevel: '3.5 - 4.5',
            tuitionFee: 4500000,
            durationWeeks: 8,
            badge: 'TỐI ƯU NHẤT CHO BẠN',
            description:
              'Khóa học được thiết kế dành riêng cho người mất gốc tiếng Anh hoàn toàn hoặc muốn xây dựng lại nền tảng phát âm IPA và ngữ pháp học thuật cốt lõi.',
            whyRecommended:
              'Bạn cần bắt đầu lại từ con số 0, chuẩn hóa 44 âm IPA và 1.500 từ vựng căn bản trước khi thử thách các bài thi phân hóa năng lực chuyên sâu.',
            highlights: [
              'Chuẩn hóa 44 âm IPA theo giọng Anh - Mỹ chuẩn quốc tế',
              'Nắm chắc 12 chủ điểm ngữ pháp hay gặp nhất trong IELTS',
              'Tích lũy 1.500 từ vựng đời sống và học thuật nền tảng',
              'Cam kết tăng ít nhất 1.0 Band điểm sau 8 tuần học',
            ],
          },
          secondaryCourses: [
            {
              code: 'IELTS-PRE',
              title: 'IELTS Pre - Làm Quen Format Đề Thi Chuẩn (3.5 - 4.5)',
              targetLevel: '4.5 - 5.5',
              tuitionFee: 5800000,
              durationWeeks: 10,
              badge: 'BƯỚC TIẾP THEO',
              description: 'Khóa học kế tiếp sau khi hoàn thành khóa Mất gốc.',
              whyRecommended: 'Lộ trình phát triển tự nhiên sau khi hoàn thành căn bản.',
              highlights: ['Làm quen format đề thi 4 kỹ năng', 'Rèn luyện Skimming & Scanning'],
            },
          ],
        };
      } else if (score < 8) {
        return {
          predictedBand: 2.5,
          bandRange: '2.0 - 3.0',
          levelName: 'Sơ khởi / Extremely Limited (A1-A2)',
          summaryFeedback:
            'Khả năng tiếng Anh của bạn còn ở mức rất sơ khởi. Cần bổ sung ngữ pháp cơ bản và 1.500 từ vựng cốt lõi trước khi tiếp cận các dạng bài học thuật phức tạp.',
          primaryCourse: {
            code: 'IELTS-LOST',
            title: 'IELTS Mất Gốc & Phát Âm Chuẩn Quốc Tế (0 - 3.5)',
            targetLevel: '3.5 - 4.5',
            tuitionFee: 4500000,
            durationWeeks: 8,
            badge: 'TỐI ƯU NHẤT CHO BẠN',
            description:
              'Xây dựng lại nền tảng phát âm IPA, từ vựng đời sống và ngữ pháp học thuật cốt lõi từ đầu.',
            whyRecommended:
              'Điểm số dưới 8 câu cho thấy vốn từ vựng nền tảng còn mỏng, cần khóa Mất gốc để củng cố gốc rễ vững vàng.',
            highlights: [
              'Nắm chắc 12 thì cơ bản và từ loại',
              'Chuẩn hóa ngữ âm và nối âm',
              'Tích lũy từ vựng theo chủ đề quen thuộc',
            ],
          },
          secondaryCourses: [
            {
              code: 'IELTS-PRE',
              title: 'IELTS Pre - Làm Quen Format Đề Thi Chuẩn (3.5 - 4.5)',
              targetLevel: '4.5 - 5.5',
              tuitionFee: 5800000,
              durationWeeks: 10,
              badge: 'BƯỚC TIẾP THEO',
              description: 'Làm quen format đề thi Cambridge.',
              whyRecommended: 'Phù hợp khi bạn đã lấy lại được nền tảng ngữ pháp cơ bản.',
              highlights: ['Kỹ thuật Skimming & Scanning'],
            },
          ],
        };
      } else if (score < 13) {
        return {
          predictedBand: 3.5,
          bandRange: '3.0 - 4.0',
          levelName: 'Sơ cấp / Limited User (A2)',
          summaryFeedback:
            'Bạn nắm được một số quy tắc ngữ pháp đơn giản nhưng gặp nhiều trở ngại với từ vựng chuyên sâu và tư duy phản biện. Khóa Pre-IELTS là lựa chọn lý tưởng để làm quen format chuẩn.',
          primaryCourse: {
            code: 'IELTS-PRE',
            title: 'IELTS Pre - Làm Quen Format Đề Thi Chuẩn (3.5 - 4.5)',
            targetLevel: '4.5 - 5.5',
            tuitionFee: 5800000,
            durationWeeks: 10,
            badge: 'TỐI ƯU NHẤT CHO BẠN',
            description:
              'Làm quen toàn diện với cấu trúc bài thi IELTS 4 kỹ năng và các dạng bài thi đọc hiểu điển hình theo chuẩn Cambridge.',
            whyRecommended:
              'Trình độ hiện tại rất thích hợp để bước vào giai đoạn tiếp cận format đề thi thực tế và các bẫy thông tin thường gặp.',
            highlights: [
              'Kỹ thuật Skimming & Scanning định vị từ khóa nhanh',
              'Phân biệt True/False/Not Given cơ bản',
              'Xây dựng vốn từ vựng học thuật 1.800 từ',
            ],
          },
          secondaryCourses: [
            {
              code: 'IELTS-FND',
              title: 'IELTS Foundation - Xây Dựng Chiến Thuật Làm Bài (4.5 - 5.5)',
              targetLevel: '5.5 - 6.5',
              tuitionFee: 7500000,
              durationWeeks: 12,
              badge: 'MỤC TIÊU TIẾP THEO',
              description: 'Chiến thuật giải quyết câu hỏi khó.',
              whyRecommended: 'Nếu bạn có khả năng tiếp thu nhanh và muốn đẩy nhanh tiến độ.',
              highlights: ['Làm chủ bài đọc dài', 'Chiến thuật Paraphrasing'],
            },
          ],
        };
      } else if (score < 18) {
        return {
          predictedBand: 4.5,
          bandRange: '4.0 - 5.0',
          levelName: 'Sơ trung cấp / Pre-Intermediate B1',
          summaryFeedback:
            'Bài thi phân hóa nâng cao khá thách thức với trình độ hiện tại. Bạn cần tập trung xây dựng chiến thuật làm bài cơ bản và bổ sung từ vựng học thuật trung cấp.',
          primaryCourse: {
            code: 'IELTS-FND',
            title: 'IELTS Foundation - Xây Dựng Chiến Thuật Làm Bài (4.5 - 5.5)',
            targetLevel: '5.5 - 6.5',
            tuitionFee: 7500000,
            durationWeeks: 12,
            badge: 'TỐI ƯU NHẤT CHO BẠN',
            description:
              'Tập trung bồi dưỡng chiến thuật xử lý các dạng câu hỏi khó trong bài thi IELTS, phát triển tư duy mở rộng ý tưởng Speaking Part 2 và Writing Task 2.',
            whyRecommended:
              'Khóa học lý tưởng để xây dựng phương pháp học bài bản, biến điểm yếu ngữ pháp và từ vựng thành điểm mạnh.',
            highlights: [
              'Thành thạo chiến thuật làm bài Reading và Listening',
              'Luyện Speaking Part 2 theo công thức chuẩn 5W1H',
              'Nắm chắc cấu trúc đoạn văn PEEL trong Writing Task 2',
              'Mock Test định kỳ trên máy tính tại EduCenter Lab',
            ],
          },
          secondaryCourses: [
            {
              code: 'IELTS-PRE',
              title: 'IELTS Pre - Làm Quen Format Đề Thi Chuẩn (3.5 - 4.5)',
              targetLevel: '4.5 - 5.5',
              tuitionFee: 5800000,
              durationWeeks: 10,
              badge: 'KHÓA BỔ TRỢ',
              description: 'Làm quen toàn diện với cấu trúc bài thi 4 kỹ năng.',
              whyRecommended: 'Giúp bạn làm quen với nhịp độ thi cử một cách thoải mái nhất.',
              highlights: ['Luyện nghe bắt từ khóa', 'Hiểu rõ tiêu chí chấm điểm'],
            },
          ],
        };
      } else if (score < 22) {
        return {
          predictedBand: 6.0,
          bandRange: '5.5 - 6.5',
          levelName: 'Khá / Upper-Intermediate B2',
          summaryFeedback:
            'Bạn có nền tảng ngữ pháp ổn định và khả năng đọc hiểu khá. Tuy nhiên vốn từ vựng C1-C2 và kỹ năng phân tích lỗi logic trong bài viết cần được bồi dưỡng thêm.',
          primaryCourse: {
            code: 'IELTS-INT',
            title: 'IELTS Bứt Phá - Chinh Phục Band Điểm Vàng (5.5 - 6.5+)',
            targetLevel: '6.5 - 7.5+',
            tuitionFee: 9200000,
            durationWeeks: 12,
            badge: 'TỐI ƯU NHẤT CHO BẠN',
            description:
              'Khóa học được học viên lựa chọn nhiều nhất tại EduCenter! Cam kết tăng 1.0 Band điểm, đạt chuẩn nộp hồ sơ xét tuyển Đại học top đầu và du học quốc tế.',
            whyRecommended:
              'Giúp bạn bứt phá từ mốc 5.5 - 6.0 lên 6.5 - 7.5+, củng cố từ vựng Collocations học thuật và chiến thuật xử lý đề thi thật.',
            highlights: [
              'Chinh phục Band 7.0+ ở 2 kỹ năng Listening & Reading',
              'Sử dụng linh hoạt Collocations & Idiomatic language trong Speaking',
              'Nâng cấp cấu trúc ngữ pháp phức trong Writing Task 2',
              'Sửa bài 1:1 hàng tuần trực tiếp với giảng viên 8.5+',
            ],
          },
          secondaryCourses: [
            {
              code: 'IELTS-FND',
              title: 'IELTS Foundation - Xây Dựng Chiến Thuật Làm Bài (4.5 - 5.5)',
              targetLevel: '5.5 - 6.5',
              tuitionFee: 7500000,
              durationWeeks: 12,
              badge: 'NỀN TẢNG CHIẾN THUẬT',
              description: 'Chiến thuật giải quyết câu hỏi hóc búa.',
              whyRecommended: 'Nếu bạn muốn luyện chắc từng dạng bài trước khi giải đề áp lực thời gian.',
              highlights: ['Chiến thuật Yes/No/Not Given', 'Phát triển ý Speaking'],
            },
          ],
        };
      } else if (score < 26) {
        return {
          predictedBand: 7.0,
          bandRange: '6.5 - 7.5+',
          levelName: 'Nâng cao / Advanced C1',
          summaryFeedback:
            'Rất tốt! Bạn nắm vững nền tảng học thuật và tư duy logic phản biện. Điểm cần hoàn thiện là tốc độ xử lý các câu hỏi bẫy suy luận ngầm và cấu trúc đảo ngữ phức tạp.',
          primaryCourse: {
            code: 'IELTS-MST',
            title: 'IELTS Master 8.0+ - Luyện Cùng Giảng Viên 9.0 IELTS',
            targetLevel: '8.0+',
            tuitionFee: 12500000,
            durationWeeks: 10,
            badge: 'TỐI ƯU NHẤT CHO BẠN',
            description:
              'Khóa học đỉnh cao dành cho học viên mục tiêu săn học bổng toàn phần du học Anh/Mỹ/Úc hoặc giảng dạy IELTS. Chấm chữa Writing & Speaking chi tiết từng từ.',
            whyRecommended:
              'Khóa học sẽ bứt phá band điểm hiện tại của bạn từ 7.0 lên mốc 8.0+, làm chủ 4 tiêu chí chấm thi của IDP & British Council.',
            highlights: [
              'Chạm mốc 8.5 - 9.0 Listening & Reading thông qua tư duy phản biện',
              'Sử dụng ngôn ngữ tự nhiên như người bản xứ (Native-like Nuances)',
              'Chấm chữa Writing Task 2 chuyên sâu từng luận điểm',
              'Coaching Speaking 1:1 cùng giảng viên 9.0',
            ],
          },
          secondaryCourses: [
            {
              code: 'IELTS-INT',
              title: 'IELTS Bứt Phá - Chinh Phục Band Điểm Vàng (5.5 - 6.5+)',
              targetLevel: '6.5 - 7.5+',
              tuitionFee: 9200000,
              durationWeeks: 12,
              badge: 'LỰA CHỌN CỦNG CỐ',
              description: 'Lựa chọn an toàn củng cố toàn diện 4 kỹ năng.',
              whyRecommended: 'Nếu bạn cần một khóa học dài hơn để tích lũy đề thi.',
              highlights: ['Giải bộ đề Cambridge thực chiến', 'Cam kết đầu ra'],
            },
          ],
        };
      } else {
        return {
          predictedBand: 8.5,
          bandRange: '8.0 - 8.5+',
          levelName: 'Đỉnh cao học thuật / Native-like Mastery C2',
          summaryFeedback:
            'Đẳng cấp xuất sắc vượt trội! Bạn sở hữu tư duy học thuật sắc bén, vốn từ vựng C2 phong phú và làm chủ hoàn toàn các cấu trúc ngữ pháp phức hợp cũng như lập luận logic PEEL.',
          primaryCourse: {
            code: 'IELTS-SPK-VIP',
            title: 'IELTS 1:1 Speaking & Writing Coaching VIP (Mục tiêu 8.0 - 8.5+)',
            targetLevel: '8.5+',
            tuitionFee: 14500000,
            durationWeeks: 8,
            badge: 'LỰA CHỌN CAO CẤP NHẤT',
            description:
              'Chương trình huấn luyện 1 kèm 1 cá nhân hóa trực tiếp cùng Master Trainer IELTS 9.0. Chấm chữa và tinh chỉnh từng sắc thái từ vựng để đạt điểm tuyệt đối Lexical Resource & Coherence.',
            whyRecommended:
              'Ở band điểm này, bạn không cần học lớp thông thường mà cần coaching 1:1 chuyên sâu để mài giũa phản xạ và xử lý các chủ đề trừu tượng.',
            highlights: [
              'Huấn luyện 1:1 trực tiếp cùng Giảng viên IELTS 9.0',
              'Sửa bài Writing & Mock Speaking không giới hạn số lượng',
              'Cam kết bằng văn bản đạt mục tiêu 8.0 - 8.5+',
              'Phòng thu âm Mock Speaking Studio tiêu chuẩn khảo thí IDP',
            ],
          },
          secondaryCourses: [
            {
              code: 'IELTS-MST',
              title: 'IELTS Master 8.0+ - Luyện Cùng Giảng Viên 9.0 IELTS',
              targetLevel: '8.0+',
              tuitionFee: 12500000,
              durationWeeks: 10,
              badge: 'LỚP HỌC THUẬT CAO CẤP',
              description: 'Khóa học đỉnh cao cùng cựu giám khảo chấm thi.',
              whyRecommended: 'Lựa chọn học nhóm nhỏ tương tác cùng các học viên xuất sắc khác.',
              highlights: ['Luyện đề dự đoán Cambridge', 'Học phí tối ưu'],
            },
          ],
        };
      }
    },
  },
];
