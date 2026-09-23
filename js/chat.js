import { auth, db, ref, push, set, onValue, serverTimestamp } from "./firebase.js";

// إنشاء حاوية المحادثات في الصفحة الحالية
const chatContainer = document.createElement('div');
chatContainer.className = 'chat-widget-container';
document.body.appendChild(chatContainer);

let activeChats = {}; // لتتبع المحادثات المفتوحة

// دالة لفتح نافذة محادثة جديدة (يتم استدعاؤها عند الضغط على زر "مراسلة" في قائمة الأصدقاء)
export function openChatWindow(targetUser) {
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) return;

  // منع فتح نفس النافذة مرتين
  if (activeChats[targetUser.uid]) return;

  // توليد معرف فريد للمحادثة (ترتيب الأبجدية لضمان توحيد المعرف بين الطرفين)
  const chatId = [currentUserId, targetUser.uid].sort().join("_");

  // بناء واجهة النافذة
  const chatWindow = document.createElement('div');
  chatWindow.className = 'chat-window active';
  chatWindow.innerHTML = `
    <div class="chat-header">
      <h4>
        <img src="${targetUser.profileImage || 'https://cdn-icons-png.flaticon.com/128/149/149071.png'}" style="width:25px; height:25px; border-radius:50%; object-fit:cover;">
        ${targetUser.name}
      </h4>
      <button class="close-chat-btn">&times;</button>
    </div>
    <div class="chat-messages" id="messages-${chatId}"></div>
    <div class="chat-input-area">
      <input type="text" id="input-${chatId}" placeholder="اكتب رسالة...">
      <button class="send-msg-btn" id="send-${chatId}">➤</button>
    </div>
  `;
  
  chatContainer.appendChild(chatWindow);
  activeChats[targetUser.uid] = chatWindow;

  // إغلاق المحادثة
  chatWindow.querySelector('.close-chat-btn').addEventListener('click', () => {
    chatWindow.remove();
    delete activeChats[targetUser.uid];
  });

  // إرسال الرسالة
  const input = chatWindow.querySelector(`#input-${chatId}`);
  const sendBtn = chatWindow.querySelector(`#send-${chatId}`);
  const messagesBox = chatWindow.querySelector(`#messages-${chatId}`);

  const sendMessage = async () => {
    const text = input.value.trim();
    if (!text) return;

    const msgRef = push(ref(db, `chats/${chatId}/messages`));
    await set(msgRef, {
      senderId: currentUserId,
      text: text,
      timestamp: serverTimestamp()
    });
    input.value = "";
  };

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // الاستماع للرسائل الحية
  onValue(ref(db, `chats/${chatId}/messages`), (snapshot) => {
    messagesBox.innerHTML = "";
    if (snapshot.exists()) {
      const msgs = Object.values(snapshot.val()).sort((a, b) => a.timestamp - b.timestamp);
      msgs.forEach(msg => {
        const div = document.createElement('div');
        div.className = `chat-bubble ${msg.senderId === currentUserId ? 'sent' : 'received'}`;
        div.textContent = msg.text;
        messagesBox.appendChild(div);
      });
      messagesBox.scrollTop = messagesBox.scrollHeight;
    }
  });
}
