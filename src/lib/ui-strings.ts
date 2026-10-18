/**
 * Словник ІНТЕРФЕЙСУ — теги, кнопки, примітки. Контент живе в site/site-en,
 * тут лише обв'язка секцій і компонентів.
 */
import type { Lang } from "@/lib/lang";

export const ui = {
  skipToContent: { uk: "Перейти до вмісту", en: "Skip to content" },
  nav: { uk: "Основна навігація", en: "Main navigation" },
  navForum: { uk: "Форум", en: "Forum" },
  writeMe: { uk: "Написати", en: "Write" },
  heroCtaProjects: { uk: "Дивитись проєкти", en: "View projects" },
  heroCtaEmail: { uk: "Написати листа", en: "Write an email" },
  sectionAbout: { uk: "Про мене", en: "About me" },
  sectionMethod: { uk: "Як я навчаю", en: "How I teach" },
  sectionWork: { uk: "Проєкти", en: "Projects" },
  sectionReviews: { uk: "Відгуки", en: "Reviews" },
  sectionCerts: { uk: "Сертифікати", en: "Certificates" },
  sectionContact: { uk: "Контакти", en: "Contact" },
  searchLabel: { uk: "Пошук по сайту", en: "Site search" },
  searchPlaceholder: {
    uk: "Пошук по сайту: курс, тема, інструмент…",
    en: "Search the site: course, topic, tool…",
  },
  searchClear: { uk: "Скинути пошук", en: "Clear search" },
  searchFound: { uk: "Знайдено", en: "Found" },
  searchFoundOf: { uk: "із", en: "of" },
  searchNothing: { uk: "Нічого не знайдено", en: "Nothing found" },
  searchBySections: { uk: "Знайдене за розділами", en: "Results by section" },
  noHitsPrefix: { uk: "За поточним запитом", en: "Nothing matches your query in" },
  noHitsSuffix: {
    uk: "не знайдено — змініть слово або скиньте пошук у полі вгорі.",
    en: "— change the word or clear the search box above.",
  },
  filterAll: { uk: "Усі", en: "All" },
  filterByTopic: { uk: "Фільтр за темою", en: "Filter by topic" },
  filterReset: { uk: "скинути фільтр", en: "reset filter" },
  filterShown: { uk: "Показано", en: "Showing" },
  aboutLead: { uk: "у розділі «Про мене» нічого", en: "the About section" },
  aboutNothing: { uk: "у розділі «Про мене» нічого", en: "the About section" },
  methodNothing: { uk: "у розділі «Як я навчаю» нічого", en: "the How I teach section" },
  workNothing: { uk: "у розділі «Проєкти» нічого", en: "the Projects section" },
  reviewsNothing: { uk: "у відгуках нічого", en: "the reviews" },
  certsNothing: { uk: "у сертифікатах нічого", en: "the certificates" },
  workAsideVolume: { uk: "Обсяг", en: "Scope" },
  workAsideVolumeText: {
    uk: "Затверджені програми — 72 і 144 години; формат — короткі модулі з практикою.",
    en: "Approved curricula — 72 and 144 hours; the format is short modules with hands-on practice.",
  },
  workAsideResult: { uk: "Підсумок", en: "Outcome" },
  workAsideResultText: {
    uk: "Де є підсумковий проєкт, слухачі захищають власну роботу — проєкт на своїх даних або власний сайт.",
    en: "Where there is a final project, learners defend their own work — a project on their own data or their own website.",
  },
  workAsideMaterials: { uk: "Матеріали", en: "Materials" },
  workAsideMaterialsText: {
    uk: "Авторська навчальна платформа викладача — презентації та конспекти до кожного слайда,",
    en: "The author's learning platform — presentations and study guides for every slide,",
  },
  workAsideMaterialsLink: { uk: "у відкритому доступі ↗", en: "open access ↗" },
  openCard: { uk: "Відкрити", en: "Open" },
  verifyDefault: { uk: "Перевірити", en: "Verify" },
  verifyAria: { uk: "відкрити перевірку", en: "open verification" },
  certsAsidePrograms: { uk: "програм", en: "programs" },
  certsAsideTopicsOne: { uk: "тема", en: "topic" },
  certsAsideTopicsFew: { uk: "теми", en: "topics" },
  reviewsIntro: {
    uk: "відгуків слухачів за напрямами, які я викладаю. Цитати наведено дослівно.",
    en: "learner reviews across the areas I teach. Quotes are verbatim.",
  },
  reviewsSearching: {
    uk: "відгуків за запитом.",
    en: "reviews match your query.",
  },
  reviewsNote: {
    uk: "Відгуки наведено дослівно, без редакторських правок. Показано схвальні відгуки за напрямами, які я викладаю.",
    en: "Reviews are quoted verbatim, without editorial changes. Positive reviews across the areas I teach are shown.",
  },
  certsIntro: {
    uk: "програм підвищення кваліфікації за трьома темами. Кожна картка веде на сторінку перевірки або курсу.",
    en: "professional development programs across three topics. Every card links to a verification page or the course page.",
  },
  certsSearching: {
    uk: "програм за запитом.",
    en: "programs match your query.",
  },
  certsNote: {
    uk: "Сертифікати Coursera / Credly верифікуються за ID на ім'я Oleg Parashchuk; для інших програм — офіційна сторінка курсу, де видають сертифікат після завершення.",
    en: "Coursera / Credly certificates are verified by ID issued to Oleg Parashchuk; for other programs — the official course page where the certificate is issued after completion.",
  },
  certIndexAria: { uk: "Теми сертифікатів", en: "Certificate topics" },
  contactLead: {
    uk: "Відкритий до викладання, консультацій і спільних курсів.",
    en: "Open to teaching, consultations and joint courses.",
  },
  contactOrChat: {
    uk: "Або запитайте в чаті — кнопка в правому нижньому куті. Публічні питання й відповіді збираються",
    en: "Or ask in the chat — the button is in the bottom-right corner. Public questions and answers are collected",
  },
  contactOrChatLink: { uk: "на форумі", en: "on the forum" },
  contactBtn: { uk: "Написати мені", en: "Write to me" },
  contactBtnEmail: { uk: "Написати листа", en: "Write an email" },
  modalTitleSent: { uk: "Лист надіслано", en: "Email sent" },
  modalTitle: { uk: "Напишіть мені", en: "Write to me" },
  modalSentText: {
    uk: "Відповім на вказану адресу — зазвичай протягом дня.",
    en: "I will reply to the address you provided — usually within a day.",
  },
  modalHint: {
    uk: "Питання прийде мені на пошту. Відповідаю особисто.",
    en: "Your message will arrive in my inbox. I reply personally.",
  },
  modalClose: { uk: "Закрити", en: "Close" },
  modalSentThanks: {
    uk: "Дякую! Лист уже в мене. Відповім на адресу, яку ви вказали.",
    en: "Thank you! Your email has reached me. I will reply to the address you provided.",
  },
  modalAgain: { uk: "написати ще раз із пошти", en: "write again from your mail app" },
  modalName: { uk: "Ім'я", en: "Name" },
  modalNamePh: { uk: "Як до вас звертатися", en: "How should I address you" },
  modalEmail: { uk: "Електронна адреса", en: "Email address" },
  modalEmailPh: {
    uk: "you@example.com — на неї прийде відповідь",
    en: "you@example.com — the reply will go there",
  },
  modalText: { uk: "Текст", en: "Message" },
  modalTextPh: {
    uk: "Що вас цікавить? Який курс, які терміни, що хочете опанувати?",
    en: "What are you interested in? Which course, what timeline, what do you want to learn?",
  },
  modalSend: { uk: "Відправити", en: "Send" },
  modalSending: { uk: "Надсилаю…", en: "Sending…" },
  modalCancel: { uk: "Відміна", en: "Cancel" },
  modalErrorEmail: {
    uk: "Вкажіть коректну електронну адресу — на неї прийде відповідь.",
    en: "Please provide a valid email address — the reply will go there.",
  },
  modalErrorSend: {
    uk: "Не вдалося надіслати. Спробуйте ще раз.",
    en: "Could not send. Please try again.",
  },
  modalErrorOffline: {
    uk: "Немає зв'язку. Перевірте інтернет і спробуйте ще раз.",
    en: "No connection. Check your internet and try again.",
  },
  chatAria: { uk: "Чат із викладачем", en: "Chat with the teacher" },
  chatOpen: { uk: "Відкрити чат", en: "Open chat" },
  chatMinimize: { uk: "Згорнути чат", en: "Minimize chat" },
  chatMinimizeX: { uk: "Згорнути", en: "Minimize" },
  chatTitle: { uk: "Запитати напряму", en: "Ask directly" },
  chatHintNew: {
    uk: "Питання прийде мені в Telegram — відповім тут же.",
    en: "Your question will reach me on Telegram — I will reply right here.",
  },
  chatHintCode: {
    uk: "Пишіть уточнення — відповім у цьому вікні.",
    en: "Write follow-ups — I will reply in this window.",
  },
  chatEmptyLead: {
    uk: "Напишіть питання — я відповім особисто, зазвичай протягом дня.",
    en: "Write your question — I answer personally, usually within a day.",
  },
  chatEmptyNote: {
    uk: "Можна уточнювати скільки завгодно — вся переписка збережеться тут.",
    en: "Ask as many follow-ups as you need — the whole conversation stays here.",
  },
  chatWaiting: {
    uk: "Питання надіслано. Відповідь з'явиться тут.",
    en: "Question sent. The answer will appear here.",
  },
  chatName: { uk: "Ім'я", en: "Name" },
  chatNamePh: { uk: "Як до вас звертатися", en: "How should I address you" },
  chatFieldFollow: { uk: "Уточнення", en: "Follow-up" },
  chatFieldQuestion: { uk: "Питання", en: "Question" },
  chatPhFollow: { uk: "Що уточнити?", en: "What would you like to clarify?" },
  chatPhQuestion: { uk: "Що вас цікавить?", en: "What are you interested in?" },
  chatFile: { uk: "Прикріпити документ", en: "Attach a document" },
  chatFileTitle: { uk: "Прикріпити документ (до 4 МБ)", en: "Attach a document (up to 4 MB)" },
  chatFileRemove: { uk: "Прибрати файл", en: "Remove file" },
  chatFileTooBig: {
    uk: "Файл завеликий — максимум 4 МБ.",
    en: "The file is too large — 4 MB max.",
  },
  chatSend: { uk: "Надіслати", en: "Send" },
  chatSendNew: { uk: "Відправити", en: "Send" },
  chatSending: { uk: "Надсилаю…", en: "Sending…" },
  chatClose: { uk: "Закрити", en: "Close" },
  chatCloseTitle: { uk: "Закрити розмову", en: "Close conversation" },
  chatErrorCode: { uk: "Код розмови:", en: "Conversation code:" },
  chatVisitor: { uk: "Відвідувач", en: "Visitor" },
  chatErrorSend: { uk: "Не вдалося надіслати.", en: "Could not send." },
  chatErrorOffline: {
    uk: "Немає зв'язку. Перевірте інтернет.",
    en: "No connection. Check your internet.",
  },
  chatErrorRetry: {
    uk: "Немає зв'язку. Спробуйте ще раз.",
    en: "No connection. Please try again.",
  },
  forumBack: { uk: "← На головну", en: "← Back to home" },
  forumAskShort: { uk: "Задати питання", en: "Ask a question" },
  forumEyebrow: { uk: "Питання й відповіді", en: "Questions & answers" },
  forumTitle: { uk: "Форум", en: "Forum" },
  forumLead: {
    uk: "Запитуйте про теми курсів — штучний інтелект, кібербезпеку й OSINT, вебдизайн, графічний дизайн, цифровий світ, обробку інформації — або про співпрацю. Відповідаю особисто, і відповідь з'являється тут же, поряд із питанням.",
    en: "Ask about course topics — artificial intelligence, cybersecurity and OSINT, web design, graphic design, the digital world, information processing — or about collaboration. I answer personally, and the answer appears right here, next to your question.",
  },
  forumLeadNote: {
    uk: "Питання без відповіді на сторінці не показуються: спершу його бачите лише ви. Щойно відповім — воно з'явиться у списку нижче.",
    en: "Questions without an answer are not shown on the page: at first only you can see yours. As soon as I reply, it will appear in the list below.",
  },
  forumAsk: { uk: "Задати питання", en: "Ask a question" },
  forumAskAside: {
    uk: "Відповідь публікується на цій сторінці — її побачать усі, кому цікава та сама тема.",
    en: "The answer is published on this page — everyone interested in the same topic will see it.",
  },
  forumName: { uk: "Ваше ім'я", en: "Your name" },
  forumNamePh: { uk: "Наприклад, Марія", en: "For example, Maria" },
  forumTopic: { uk: "Тема", en: "Topic" },
  forumTopicAria: { uk: "Тема питання", en: "Question topic" },
  forumQuestion: { uk: "Питання", en: "Question" },
  forumQuestionPh: {
    uk: "Опишіть питання — чим конкретніше, тим корисніша відповідь.",
    en: "Describe your question — the more specific, the more useful the answer.",
  },
  forumSubmit: { uk: "Надіслати питання", en: "Send question" },
  forumSending: { uk: "Надсилаю…", en: "Sending…" },
  forumSent: {
    uk: "Дякую! Питання надіслано — відповідь з'явиться на цій сторінці.",
    en: "Thank you! Your question has been sent — the answer will appear on this page.",
  },
  forumErrName: { uk: "Як до вас звертатися? Хоча б ім'я.", en: "How should I address you? At least a first name." },
  forumErrTopic: { uk: "Оберіть тему питання.", en: "Please choose a topic." },
  forumErrQuestion: {
    uk: "Опишіть питання — хоча б кілька слів.",
    en: "Describe your question — at least a few words.",
  },
  forumErrSend: {
    uk: "Не вдалося надіслати. Спробуйте ще раз.",
    en: "Could not send. Please try again.",
  },
  forumErrOffline: {
    uk: "Немає зв'язку. Перевірте інтернет і спробуйте ще раз.",
    en: "No connection. Check your internet and try again.",
  },
  forumLoadErr: {
    uk: "Не вдалося завантажити форум.",
    en: "Could not load the forum.",
  },
  forumLoadErrOffline: {
    uk: "Немає зв'язку. Спробуйте оновити сторінку.",
    en: "No connection. Try refreshing the page.",
  },
  forumPending: { uk: "Чекають відповіді", en: "Awaiting answers" },
  forumPendingTag: { uk: "⏳ очікує відповіді", en: "⏳ awaiting answer" },
  forumQa: { uk: "Питання й відповіді", en: "Questions & answers" },
  forumRefresh: { uk: "Оновити", en: "Refresh" },
  forumLoading: { uk: "Завантажую…", en: "Loading…" },
  forumEmpty: {
    uk: "Поки що тут порожньо. Будьте першим — задайте питання у формі вище; після відповіді воно з'явиться тут.",
    en: "Nothing here yet. Be the first — ask a question in the form above; it will appear here once answered.",
  },
  forumAnswerOne: { uk: "Відповідь", en: "Answer" },
  forumMeta: {
    uk: "Фільтр за темою",
    en: "Filter by topic",
  },
} as const;

export type UiKey = keyof typeof ui;

export function t(key: UiKey, lang: Lang): string {
  return ui[key][lang];
}
