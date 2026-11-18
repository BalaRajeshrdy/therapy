import { parseISO } from 'date-fns'
import type { Lang, MessageKind } from './types'

/**
 * Message templates in the family's language. Non-English text is an
 * "AI sample translation" for the demo and should be reviewed by a fluent speaker
 * before real use.
 */
type T = Record<MessageKind, [string, string]>

const en: T = {
  confirmation: ['Appointment confirmed – {child}', 'Hi {parent}, {child}’s {service} with {therapist} is confirmed for {date} at {time}. Reply to this message if you need to make a change.'],
  forms: ['Please complete intake & consent forms', 'Hi {parent}, before {child}’s first visit please complete the intake and consent forms in your parent portal. It takes about 5 minutes.'],
  reminder: ['Reminder: {child}’s visit on {date}', 'Hi {parent}, a reminder that {child} has {service} with {therapist} on {date} at {time}. Please confirm, or let us know if you need to reschedule.'],
  invoice: ['Invoice {number} – {amount}', 'Hi {parent}, invoice {number} for {amount} is ready in your parent portal. Payment is due by {due}. Thank you!'],
  receipt: ['Receipt {number} – paid', 'Hi {parent}, thank you for your payment of {amount}. Receipt {number} is in your parent portal and includes the therapist’s designation and registration number for insurance.'],
  overdue: ['Friendly reminder: invoice {number}', 'Hi {parent}, a friendly note that invoice {number} for {amount} is now {days} days past due. If you’ve already paid, please ignore this message.'],
  'waitlist-offer': ['An appointment opened up for you', 'Hi {parent}, a spot opened on {date} at {time} with {therapist}. We’re holding it for you until {hold}. Reply YES to accept.'],
  plan: ['{child}’s treatment plan', 'Hi {parent}, following {child}’s assessment, {therapist} recommends {weeks} weekly sessions. Please choose one of the weekly times offered in your parent portal.'],
  statement: ['Your statement for {month}', 'Hi {parent}, your statement for {month} is ready in your parent portal. Current balance: {amount}.'],
  report: ['{child}’s progress report', 'Hi {parent}, {child}’s latest progress report is ready to view in your parent portal.'],
  'home-program': ['{child}’s home program this week', 'Hi {parent}, here are this week’s home activities for {child}: {activities}. Tick them off in the portal as you go!'],
}

const fr: T = {
  confirmation: ['Rendez-vous confirmé – {child}', 'Bonjour {parent}, le rendez-vous de {child} ({service}) avec {therapist} est confirmé le {date} à {time}. Répondez à ce message pour toute modification.'],
  forms: ['Formulaires d’accueil et de consentement', 'Bonjour {parent}, avant la première visite de {child}, veuillez remplir les formulaires d’accueil et de consentement dans votre portail parent. Cela prend environ 5 minutes.'],
  reminder: ['Rappel : visite de {child} le {date}', 'Bonjour {parent}, petit rappel : {child} a rendez-vous ({service}) avec {therapist} le {date} à {time}. Merci de confirmer ou de nous indiquer si vous devez reporter.'],
  invoice: ['Facture {number} – {amount}', 'Bonjour {parent}, la facture {number} de {amount} est disponible dans votre portail parent. Paiement dû le {due}. Merci !'],
  receipt: ['Reçu {number} – payé', 'Bonjour {parent}, merci pour votre paiement de {amount}. Le reçu {number} est dans votre portail et indique la désignation et le numéro d’inscription de la thérapeute pour l’assurance.'],
  overdue: ['Rappel amical : facture {number}', 'Bonjour {parent}, un petit mot pour signaler que la facture {number} de {amount} est en retard de {days} jours. Si vous avez déjà payé, veuillez ignorer ce message.'],
  'waitlist-offer': ['Une place s’est libérée pour vous', 'Bonjour {parent}, une place s’est libérée le {date} à {time} avec {therapist}. Nous la gardons pour vous jusqu’à {hold}. Répondez OUI pour accepter.'],
  plan: ['Plan de traitement de {child}', 'Bonjour {parent}, à la suite de l’évaluation de {child}, {therapist} recommande {weeks} séances hebdomadaires. Veuillez choisir l’un des créneaux proposés dans votre portail parent.'],
  statement: ['Votre relevé pour {month}', 'Bonjour {parent}, votre relevé pour {month} est disponible dans votre portail parent. Solde actuel : {amount}.'],
  report: ['Rapport de progrès de {child}', 'Bonjour {parent}, le dernier rapport de progrès de {child} est disponible dans votre portail parent.'],
  'home-program': ['Programme maison de {child} cette semaine', 'Bonjour {parent}, voici les activités à la maison de {child} cette semaine : {activities}. Cochez-les dans le portail au fur et à mesure !'],
}

const es: T = {
  confirmation: ['Cita confirmada – {child}', 'Hola {parent}, la cita de {child} ({service}) con {therapist} está confirmada para el {date} a las {time}. Responda a este mensaje si necesita hacer un cambio.'],
  forms: ['Complete los formularios de admisión y consentimiento', 'Hola {parent}, antes de la primera visita de {child}, complete los formularios de admisión y consentimiento en su portal para padres. Toma unos 5 minutos.'],
  reminder: ['Recordatorio: visita de {child} el {date}', 'Hola {parent}, le recordamos que {child} tiene {service} con {therapist} el {date} a las {time}. Por favor confirme o avísenos si necesita cambiar la cita.'],
  invoice: ['Factura {number} – {amount}', 'Hola {parent}, la factura {number} por {amount} está disponible en su portal para padres. El pago vence el {due}. ¡Gracias!'],
  receipt: ['Recibo {number} – pagado', 'Hola {parent}, gracias por su pago de {amount}. El recibo {number} está en su portal e incluye la designación y el número de registro de la terapeuta para su seguro.'],
  overdue: ['Recordatorio amable: factura {number}', 'Hola {parent}, le recordamos amablemente que la factura {number} por {amount} tiene {days} días de atraso. Si ya pagó, ignore este mensaje.'],
  'waitlist-offer': ['Se abrió una cita para usted', 'Hola {parent}, se abrió un espacio el {date} a las {time} con {therapist}. Lo reservamos para usted hasta {hold}. Responda SÍ para aceptar.'],
  plan: ['Plan de tratamiento de {child}', 'Hola {parent}, tras la evaluación de {child}, {therapist} recomienda {weeks} sesiones semanales. Elija uno de los horarios semanales ofrecidos en su portal para padres.'],
  statement: ['Su estado de cuenta de {month}', 'Hola {parent}, su estado de cuenta de {month} está disponible en su portal para padres. Saldo actual: {amount}.'],
  report: ['Informe de progreso de {child}', 'Hola {parent}, el informe de progreso más reciente de {child} ya está disponible en su portal para padres.'],
  'home-program': ['Programa en casa de {child} esta semana', 'Hola {parent}, estas son las actividades en casa de {child} para esta semana: {activities}. ¡Márquelas en el portal a medida que las hagan!'],
}

const pa: T = {
  confirmation: ['ਮੁਲਾਕਾਤ ਪੱਕੀ ਹੋ ਗਈ – {child}', 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ {parent}, {child} ਦੀ {therapist} ਨਾਲ {service} {date} ਨੂੰ {time} ਵਜੇ ਪੱਕੀ ਹੈ। ਕੋਈ ਬਦਲਾਅ ਕਰਨਾ ਹੋਵੇ ਤਾਂ ਇਸ ਸੁਨੇਹੇ ਦਾ ਜਵਾਬ ਦਿਓ।'],
  forms: ['ਦਾਖਲਾ ਅਤੇ ਸਹਿਮਤੀ ਫਾਰਮ ਭਰੋ', 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ {parent}, {child} ਦੀ ਪਹਿਲੀ ਮੁਲਾਕਾਤ ਤੋਂ ਪਹਿਲਾਂ ਕਿਰਪਾ ਕਰਕੇ ਮਾਪਿਆਂ ਦੇ ਪੋਰਟਲ ਵਿੱਚ ਦਾਖਲਾ ਅਤੇ ਸਹਿਮਤੀ ਫਾਰਮ ਭਰੋ। ਇਸ ਵਿੱਚ ਲਗਭਗ 5 ਮਿੰਟ ਲੱਗਦੇ ਹਨ।'],
  reminder: ['ਯਾਦ-ਪੱਤਰ: {date} ਨੂੰ {child} ਦੀ ਮੁਲਾਕਾਤ', 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ {parent}, ਯਾਦ ਰਹੇ ਕਿ {child} ਦੀ {therapist} ਨਾਲ {service} {date} ਨੂੰ {time} ਵਜੇ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਪੁਸ਼ਟੀ ਕਰੋ ਜਾਂ ਸਮਾਂ ਬਦਲਣਾ ਹੋਵੇ ਤਾਂ ਦੱਸੋ।'],
  invoice: ['ਬਿੱਲ {number} – {amount}', 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ {parent}, {amount} ਦਾ ਬਿੱਲ {number} ਤੁਹਾਡੇ ਮਾਪਿਆਂ ਦੇ ਪੋਰਟਲ ਵਿੱਚ ਹੈ। ਭੁਗਤਾਨ ਦੀ ਆਖਰੀ ਤਾਰੀਖ {due} ਹੈ। ਧੰਨਵਾਦ!'],
  receipt: ['ਰਸੀਦ {number} – ਭੁਗਤਾਨ ਹੋ ਗਿਆ', 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ {parent}, {amount} ਦੇ ਭੁਗਤਾਨ ਲਈ ਧੰਨਵਾਦ। ਰਸੀਦ {number} ਪੋਰਟਲ ਵਿੱਚ ਹੈ ਅਤੇ ਇਸ ਵਿੱਚ ਬੀਮੇ ਲਈ ਥੈਰੇਪਿਸਟ ਦਾ ਅਹੁਦਾ ਅਤੇ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਨੰਬਰ ਹੈ।'],
  overdue: ['ਨਿਮਰ ਯਾਦ-ਪੱਤਰ: ਬਿੱਲ {number}', 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ {parent}, {amount} ਦਾ ਬਿੱਲ {number} ਹੁਣ {days} ਦਿਨ ਲੇਟ ਹੈ। ਜੇ ਤੁਸੀਂ ਭੁਗਤਾਨ ਕਰ ਦਿੱਤਾ ਹੈ ਤਾਂ ਇਸ ਸੁਨੇਹੇ ਨੂੰ ਨਜ਼ਰਅੰਦਾਜ਼ ਕਰੋ।'],
  'waitlist-offer': ['ਤੁਹਾਡੇ ਲਈ ਇੱਕ ਮੁਲਾਕਾਤ ਖਾਲੀ ਹੋਈ ਹੈ', 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ {parent}, {date} ਨੂੰ {time} ਵਜੇ {therapist} ਨਾਲ ਇੱਕ ਸਮਾਂ ਖਾਲੀ ਹੋਇਆ ਹੈ। ਅਸੀਂ ਇਸਨੂੰ {hold} ਤੱਕ ਤੁਹਾਡੇ ਲਈ ਰੱਖ ਰਹੇ ਹਾਂ। ਮਨਜ਼ੂਰ ਕਰਨ ਲਈ YES ਲਿਖੋ।'],
  plan: ['{child} ਦੀ ਇਲਾਜ ਯੋਜਨਾ', 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ {parent}, {child} ਦੇ ਮੁਲਾਂਕਣ ਤੋਂ ਬਾਅਦ {therapist} {weeks} ਹਫ਼ਤਾਵਾਰੀ ਸੈਸ਼ਨਾਂ ਦੀ ਸਿਫ਼ਾਰਸ਼ ਕਰਦੇ ਹਨ। ਕਿਰਪਾ ਕਰਕੇ ਪੋਰਟਲ ਵਿੱਚ ਦਿੱਤੇ ਹਫ਼ਤਾਵਾਰੀ ਸਮਿਆਂ ਵਿੱਚੋਂ ਇੱਕ ਚੁਣੋ।'],
  statement: ['{month} ਲਈ ਤੁਹਾਡਾ ਖਾਤਾ ਵੇਰਵਾ', 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ {parent}, {month} ਦਾ ਤੁਹਾਡਾ ਖਾਤਾ ਵੇਰਵਾ ਪੋਰਟਲ ਵਿੱਚ ਹੈ। ਮੌਜੂਦਾ ਬਕਾਇਆ: {amount}।'],
  report: ['{child} ਦੀ ਤਰੱਕੀ ਰਿਪੋਰਟ', 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ {parent}, {child} ਦੀ ਨਵੀਂ ਤਰੱਕੀ ਰਿਪੋਰਟ ਤੁਹਾਡੇ ਮਾਪਿਆਂ ਦੇ ਪੋਰਟਲ ਵਿੱਚ ਦੇਖਣ ਲਈ ਤਿਆਰ ਹੈ।'],
  'home-program': ['ਇਸ ਹਫ਼ਤੇ {child} ਦਾ ਘਰੇਲੂ ਪ੍ਰੋਗਰਾਮ', 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ {parent}, ਇਸ ਹਫ਼ਤੇ {child} ਲਈ ਘਰੇਲੂ ਗਤੀਵਿਧੀਆਂ: {activities}। ਪੂਰੀਆਂ ਹੋਣ ʼਤੇ ਪੋਰਟਲ ਵਿੱਚ ਨਿਸ਼ਾਨ ਲਗਾਓ!'],
}

const zh: T = {
  confirmation: ['预约已确认 – {child}', '{parent}您好，{child}与{therapist}的{service}已确认，时间为{date} {time}。如需更改，请回复此消息。'],
  forms: ['请填写入院登记表和同意书', '{parent}您好，在{child}首次就诊前，请在家长门户中填写登记表和同意书，大约需要5分钟。'],
  reminder: ['提醒：{child}于{date}的就诊', '{parent}您好，提醒您{child}将于{date} {time}与{therapist}进行{service}。请确认，如需改期请告知我们。'],
  invoice: ['发票 {number} – {amount}', '{parent}您好，金额为{amount}的发票{number}已在家长门户中生成，请于{due}前付款。谢谢！'],
  receipt: ['收据 {number} – 已付款', '{parent}您好，感谢您支付{amount}。收据{number}已在门户中，并注明治疗师的资质和注册号，可用于保险报销。'],
  overdue: ['温馨提醒：发票 {number}', '{parent}您好，温馨提醒：金额为{amount}的发票{number}已逾期{days}天。如您已付款，请忽略此消息。'],
  'waitlist-offer': ['为您空出了一个预约名额', '{parent}您好，{therapist}在{date} {time}有一个空位。我们为您保留至{hold}。回复“是”即可接受。'],
  plan: ['{child}的治疗计划', '{parent}您好，根据{child}的评估结果，{therapist}建议进行{weeks}次每周治疗。请在家长门户中选择一个每周时段。'],
  statement: ['您{month}的账单明细', '{parent}您好，您{month}的账单明细已在家长门户中。当前余额：{amount}。'],
  report: ['{child}的进展报告', '{parent}您好，{child}最新的进展报告已可在家长门户中查看。'],
  'home-program': ['{child}本周的家庭练习', '{parent}您好，这是{child}本周的家庭活动：{activities}。完成后请在门户中打勾！'],
}

const ar: T = {
  confirmation: ['تم تأكيد الموعد – {child}', 'مرحبًا {parent}، تم تأكيد موعد {child} ({service}) مع {therapist} يوم {date} الساعة {time}. يرجى الرد على هذه الرسالة إذا احتجت إلى أي تغيير.'],
  forms: ['يرجى تعبئة نموذجي التسجيل والموافقة', 'مرحبًا {parent}، قبل الزيارة الأولى لـ{child} يرجى تعبئة نموذجي التسجيل والموافقة في بوابة الأهل. يستغرق ذلك نحو 5 دقائق.'],
  reminder: ['تذكير: زيارة {child} يوم {date}', 'مرحبًا {parent}، نذكّرك بأن لدى {child} موعد {service} مع {therapist} يوم {date} الساعة {time}. يرجى التأكيد أو إعلامنا إذا احتجت إلى تغيير الموعد.'],
  invoice: ['الفاتورة {number} – {amount}', 'مرحبًا {parent}، الفاتورة {number} بمبلغ {amount} متاحة في بوابة الأهل. موعد الدفع {due}. شكرًا لك!'],
  receipt: ['الإيصال {number} – مدفوع', 'مرحبًا {parent}، شكرًا لدفعك مبلغ {amount}. الإيصال {number} متاح في البوابة ويتضمن مسمّى المعالِجة ورقم تسجيلها لأغراض التأمين.'],
  overdue: ['تذكير ودي: الفاتورة {number}', 'مرحبًا {parent}، تذكير ودي بأن الفاتورة {number} بمبلغ {amount} متأخرة منذ {days} يومًا. إذا كنت قد دفعت بالفعل فيرجى تجاهل هذه الرسالة.'],
  'waitlist-offer': ['أصبح هناك موعد متاح لك', 'مرحبًا {parent}، أصبح هناك موعد متاح يوم {date} الساعة {time} مع {therapist}. سنحجزه لك حتى {hold}. أرسل "نعم" للقبول.'],
  plan: ['خطة العلاج لـ{child}', 'مرحبًا {parent}، بعد تقييم {child} يوصي {therapist} بـ{weeks} جلسات أسبوعية. يرجى اختيار أحد الأوقات الأسبوعية المعروضة في بوابة الأهل.'],
  statement: ['كشف حسابك لشهر {month}', 'مرحبًا {parent}، كشف حسابك لشهر {month} متاح في بوابة الأهل. الرصيد الحالي: {amount}.'],
  report: ['تقرير تقدّم {child}', 'مرحبًا {parent}، أحدث تقرير لتقدّم {child} متاح الآن في بوابة الأهل.'],
  'home-program': ['البرنامج المنزلي لـ{child} هذا الأسبوع', 'مرحبًا {parent}، هذه أنشطة {child} المنزلية لهذا الأسبوع: {activities}. ضع علامة عليها في البوابة عند إنجازها!'],
}

const templates: Record<Lang, T> = { en, fr, es, pa, zh, ar }
const locales: Record<Lang, string> = { en: 'en-CA', fr: 'fr-CA', es: 'es', pa: 'pa-IN', zh: 'zh-CN', ar: 'ar' }

export interface MessageVars {
  parent?: string
  child?: string
  therapist?: string
  service?: string
  date?: string // ISO date
  time?: string // HH:mm
  amount?: number
  number?: string
  due?: string // ISO date
  days?: number
  hold?: string // ISO timestamp
  weeks?: number
  month?: string // ISO date in month
  activities?: string
}

export function renderMessage(kind: MessageKind, lang: Lang, v: MessageVars) {
  const loc = locales[lang]
  const fmtDate = (d?: string) => {
    if (!d) return ''
    const date = parseISO(d)
    // Some browsers lack short month names for a locale and print "M11"; fall back gracefully.
    for (const opts of [{ weekday: 'short', month: 'short', day: 'numeric' }, { month: 'long', day: 'numeric' }] as const) {
      const out = new Intl.DateTimeFormat(loc, opts).format(date)
      if (!/\bM\d{1,2}\b/.test(out)) return out
    }
    return new Intl.DateTimeFormat('en-CA', { weekday: 'short', month: 'short', day: 'numeric' }).format(date)
  }
  const fmtTime = (t?: string) => {
    if (!t) return ''
    const [h, m] = t.split(':').map(Number)
    const d = new Date(2026, 0, 1, h, m)
    return new Intl.DateTimeFormat(loc, { hour: 'numeric', minute: '2-digit' }).format(d)
  }
  const map: Record<string, string> = {
    parent: v.parent ?? '',
    child: v.child ?? '',
    therapist: v.therapist ?? '',
    service: v.service ?? '',
    date: fmtDate(v.date),
    time: fmtTime(v.time),
    amount: v.amount != null ? new Intl.NumberFormat(loc, { style: 'currency', currency: 'CAD' }).format(v.amount) : '',
    number: v.number ?? '',
    due: fmtDate(v.due),
    days: String(v.days ?? ''),
    hold: v.hold ? new Intl.DateTimeFormat(loc, { timeZone: 'America/Toronto', hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' }).format(new Date(v.hold)) : '',
    weeks: String(v.weeks ?? ''),
    month: v.month ? new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric' }).format(parseISO(v.month)) : '',
    activities: v.activities ?? '',
  }
  const fill = (s: string) => s.replace(/\{(\w+)\}/g, (_, k) => map[k] ?? '').replace(/\.\./g, '.')
  const [subject, body] = templates[lang][kind]
  return { subject: fill(subject), body: fill(body) }
}

/** Home-program activity library with translated titles. */
export const activityLibrary: { key: string; domain: import('./types').Domain; frequency: string; title: Record<Lang, string> }[] = [
  { key: 'buttons', domain: 'Fine motor', frequency: '5 min, daily', title: { en: 'Button practice on a big-button shirt', fr: 'Pratique des boutons sur une chemise à gros boutons', es: 'Práctica de botones en una camisa de botones grandes', pa: 'ਵੱਡੇ ਬਟਨਾਂ ਵਾਲੀ ਕਮੀਜ਼ ʼਤੇ ਬਟਨ ਲਾਉਣ ਦਾ ਅਭਿਆਸ', zh: '在大纽扣衬衫上练习扣纽扣', ar: 'التدرّب على الأزرار بقميص ذي أزرار كبيرة' } },
  { key: 'playdough', domain: 'Fine motor', frequency: '10 min, 3× a week', title: { en: 'Play-dough squeeze & pinch', fr: 'Pâte à modeler : presser et pincer', es: 'Plastilina: apretar y pellizcar', pa: 'ਪਲੇ-ਡੋ ਨੂੰ ਦਬਾਉਣਾ ਅਤੇ ਚੂੰਢੀ ਭਰਨਾ', zh: '橡皮泥：挤压和捏', ar: 'الصلصال: الضغط والقرص' } },
  { key: 'animal-walks', domain: 'Gross motor', frequency: '5 min, daily', title: { en: 'Animal walks (bear, crab, frog)', fr: 'Marches d’animaux (ours, crabe, grenouille)', es: 'Caminatas de animales (oso, cangrejo, rana)', pa: 'ਜਾਨਵਰਾਂ ਵਾਂਗ ਚੱਲਣਾ (ਰਿੱਛ, ਕੇਕੜਾ, ਡੱਡੂ)', zh: '动物走路（熊、螃蟹、青蛙）', ar: 'مشي الحيوانات (الدب، السلطعون، الضفدع)' } },
  { key: 'calm-corner', domain: 'Sensory', frequency: 'Before transitions', title: { en: '5-minute calm-down routine', fr: 'Routine de retour au calme de 5 minutes', es: 'Rutina de calma de 5 minutos', pa: '5 ਮਿੰਟ ਦੀ ਸ਼ਾਂਤ ਹੋਣ ਦੀ ਰੁਟੀਨ', zh: '5分钟冷静放松练习', ar: 'روتين تهدئة لمدة 5 دقائق' } },
  { key: 'dressing', domain: 'Self-care', frequency: 'Every morning', title: { en: 'Put on socks & shoes independently', fr: 'Mettre ses chaussettes et chaussures seul', es: 'Ponerse calcetines y zapatos sin ayuda', pa: 'ਆਪੇ ਜੁਰਾਬਾਂ ਅਤੇ ਜੁੱਤੇ ਪਾਉਣਾ', zh: '自己穿袜子和鞋子', ar: 'لبس الجوارب والحذاء باستقلالية' } },
  { key: 'tracing', domain: 'Handwriting', frequency: '10 min, 3× a week', title: { en: 'Tracing letters in a sand tray', fr: 'Tracer des lettres dans un bac de sable', es: 'Trazar letras en una bandeja de arena', pa: 'ਰੇਤ ਦੀ ਟਰੇ ਵਿੱਚ ਅੱਖਰ ਬਣਾਉਣਾ', zh: '在沙盘里描字母', ar: 'تتبّع الحروف في صينية رمل' } },
  { key: 'pegs', domain: 'Fine motor', frequency: '5 min, daily', title: { en: 'Clothes-peg pick-up game', fr: 'Jeu de ramassage avec pinces à linge', es: 'Juego de recoger con pinzas de ropa', pa: 'ਕੱਪੜਿਆਂ ਵਾਲੀਆਂ ਚੂੰਢੀਆਂ ਨਾਲ ਚੁੱਕਣ ਦੀ ਖੇਡ', zh: '用衣夹夹取游戏', ar: 'لعبة الالتقاط بملاقط الغسيل' } },
  { key: 'balance', domain: 'Gross motor', frequency: '5 min, daily', title: { en: 'Balance walk along a tape line', fr: 'Marcher en équilibre sur une ligne de ruban', es: 'Caminar en equilibrio sobre una línea de cinta', pa: 'ਟੇਪ ਦੀ ਲਕੀਰ ʼਤੇ ਸੰਤੁਲਨ ਨਾਲ ਤੁਰਨਾ', zh: '沿胶带线走平衡', ar: 'المشي بتوازن على خط من الشريط اللاصق' } },
]
export const activityTitle = (key: string, lang: Lang) => activityLibrary.find((a) => a.key === key)?.title[lang] ?? key
