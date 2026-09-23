import { auth, db, ref, push, set, onValue } from "./firebase.js";
import { showToast } from "./posts.js";

// Event Delegation للتعامل مع أي زر "تعليق" في الـ Feed
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("comment-btn")) {
    const postCard = e.target.closest(".post-card");
    const postId = postCard.dataset.id;
    
    // التحقق مما إذا كان قسم التعليقات مفتوحاً بالفعل
    let commentsSection = postCard.querySelector(".comments-section");
    
    if (!commentsSection) {
      // بناء واجهة التعليقات
      commentsSection = document.createElement("div");
      commentsSection.className = "comments-section";
      commentsSection.style.marginTop = "15px";
      commentsSection.style.borderTop = "1px solid var(--border-glass)";
      commentsSection.style.paddingTop = "15px";

      commentsSection.innerHTML = `
        <div class="comments-list" id="comments-list-${postId}" style="max-height: 250px; overflow-y: auto; margin-bottom: 10px;">
          <div style="text-align: center; color: var(--text-muted); font-size: 0.9rem;">جاري تحميل التعليقات...</div>
        </div>
        <div class="comment-input-wrapper" style="display: flex; gap: 10px;">
          <input type="text" class="comment-input" placeholder="اكتب تعليقاً..." style="flex: 1; padding: 10px; border-radius: 20px; border: 1px solid var(--border-glass); background: rgba(0,0,0,0.3); color: #fff;">
          <button class="btn-primary send-comment-btn" data-post-id="${postId}">إرسال</button>
        </div>
      `;
      postCard.appendChild(commentsSection);
      
      // جلب التعليقات من Firebase
      loadComments(postId);
    } else {
      // إخفاء/إظهار
      commentsSection.classList.toggle("hidden");
    }
  }

  // إرسال التعليق
  if (e.target.classList.contains("send-comment-btn")) {
    const postId = e.target.dataset.postId;
    const inputField = e.target.previousElementSibling;
    const text = inputField.value.trim();
    
    if (text === "") return;

    submitComment(postId, text, inputField);
  }
});

async function submitComment(postId, text, inputField) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    showToast("يجب تسجيل الدخول للتعليق", "error");
    return;
  }

  const commentRef = push(ref(db, `comments/${postId}`));
  const commentData = {
    userId: currentUser.uid,
    text: text,
    createdAt: Date.now()
  };

  try {
    await set(commentRef, commentData);
    inputField.value = "";
    showToast("تم إضافة التعليق");
  } catch (err) {
    showToast("فشل في إرسال التعليق", "error");
  }
}

function loadComments(postId) {
  const commentsList = document.getElementById(`comments-list-${postId}`);
  const commentsRef = ref(db, `comments/${postId}`);

  onValue(commentsRef, (snapshot) => {
    commentsList.innerHTML = "";
    if (!snapshot.exists()) {
      commentsList.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.85rem;">لا توجد تعليقات بعد. كن أول من يعلق!</div>`;
      return;
    }

    const commentsData = snapshot.val();
    const sortedComments = Object.values(commentsData).sort((a, b) => a.createdAt - b.createdAt);

    sortedComments.forEach(comment => {
      const commentEl = document.createElement("div");
      commentEl.style.cssText = "background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; margin-bottom: 8px;";
      // لتبسيط المثال، نضع اسم افتراضي (في الإنتاج يتم جلب اسم المستخدم عبر userId)
      commentEl.innerHTML = `
        <strong style="color: var(--accent-color); font-size: 0.9rem;">مستخدم sky7</strong>
        <p style="margin-top: 4px; font-size: 0.95rem;">${comment.text}</p>
        <span style="font-size: 0.7rem; color: var(--text-dim);">${new Date(comment.createdAt).toLocaleTimeString()}</span>
      `;
      commentsList.appendChild(commentEl);
    });
    
    // التمرير لأسفل تلقائياً
    commentsList.scrollTop = commentsList.scrollHeight;
  });
}
