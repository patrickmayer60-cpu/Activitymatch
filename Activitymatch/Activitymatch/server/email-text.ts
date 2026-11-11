type Publish = {language:string;name:string;title:string;confirmUrl:string;manageUrl:string};
export function publishEmail(data:Publish){
 return data.language === "en" ? {
  subject:"Please confirm your ActivityMatch listing",
  text:`Hi ${data.name},\n\nPlease open this link and confirm your listing “${data.title}” (valid for 24 hours):\n${data.confirmUrl}\n\nYour private link to edit or delete your listing and pause enquiries:\n${data.manageUrl}\n\nKeep this email and do not share your management link. If you did not create this listing, ignore this email. It will not be published.\n\nActivityMatch`,
 }:{
  subject:"Bitte bestätige deine ActivityMatch-Anzeige",
  text:`Hallo ${data.name},\n\nbitte öffne diesen Link und bestätige dort deine Anzeige „${data.title}“ (24 Stunden gültig):\n${data.confirmUrl}\n\nDein privater Verwaltungslink zum Bearbeiten, Pausieren von Anfragen und Löschen:\n${data.manageUrl}\n\nBewahre diese E-Mail auf und teile den Verwaltungslink nicht. Wenn du die Anzeige nicht erstellt hast, ignoriere diese E-Mail. Die Anzeige wird dann nicht veröffentlicht.\n\nActivityMatch`,
 };
}
export function requestEmail(data:{language:string;name:string;title:string;url:string}){
 return data.language === "en" ? {
  subject:"Confirm your ActivityMatch enquiry",
  text:`Hi ${data.name},\n\nPlease open this link and confirm your enquiry about “${data.title}” (valid for 1 hour):\n${data.url}\n\nOnly after confirmation will your first name, message and email address be shared with the listing creator. If you did not send an enquiry, ignore this email.\n\nActivityMatch`,
 }:{
  subject:"Bestätige deine Anfrage bei ActivityMatch",
  text:`Hallo ${data.name},\n\nbitte öffne diesen Link und bestätige dort deine Anfrage zur Anzeige „${data.title}“ (1 Stunde gültig):\n${data.url}\n\nErst danach werden dein Vorname, deine Nachricht und deine E-Mail-Adresse an den Ersteller übermittelt. Wenn du keine Anfrage gestellt hast, ignoriere diese E-Mail.\n\nActivityMatch`,
 };
}
export function forwardEmail(data:{language:string;owner:string;name:string;title:string;message:string;email:string;url:string}){
 return data.language === "en" ? {
  subject:"New enquiry about your ActivityMatch listing",
  text:`Hi ${data.owner},\n\n${data.name} writes about your listing “${data.title}”:\n\n${data.message}\n\nReply address: ${data.email}\n\nClick Reply in your email app to reply directly to this person. Your email address will then be visible to them.\n\nListing: ${data.url}\n\nUnwanted enquiries? Use the private management link in your original confirmation email to pause enquiries or delete the listing.\n\nActivityMatch`,
 }:{
  subject:"Neue Anfrage zu deiner ActivityMatch-Anzeige",
  text:`Hallo ${data.owner},\n\n${data.name} schreibt zu deiner Anzeige „${data.title}“:\n\n${data.message}\n\nAntwortadresse: ${data.email}\n\nDu kannst in deinem E-Mail-Programm auf Antworten klicken. Deine Antwort geht direkt an diese Person; dabei wird auch deine E-Mail-Adresse für sie sichtbar.\n\nAnzeige: ${data.url}\n\nUnerwünschte Anfragen? Über den privaten Verwaltungslink in deiner ursprünglichen Bestätigungs-E-Mail kannst du Anfragen deaktivieren oder die Anzeige löschen.\n\nActivityMatch`,
 };
}
