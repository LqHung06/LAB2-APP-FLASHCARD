export function speakText(text, lang = 'en-US') {
  if (!window.speechSynthesis) {
    console.warn('Trình duyệt của bạn không hỗ trợ Web Speech API');
    return;
  }
  
  // Dừng các giọng đọc đang dang dở để phát ngay câu mới
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9; // Đọc chậm một chút để dễ nghe hơn
  window.speechSynthesis.speak(utterance);
}
