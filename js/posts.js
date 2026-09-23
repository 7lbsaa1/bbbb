import { db, ref, push, set, onValue, auth } from "./firebase.js";
import { compressAndConvertToBase64 } from "./imageCompression.js";

const postsFeed = document.getElementById("posts-feed");
const openModalBtn = document.getElementById("open-upload-modal");
const uploadModal = document.getElementById("upload-modal");
const closeModalBtn = document.getElementById("close-upload-modal");
const imageInput = document.getElementById("image-input");
const dropzone = document.getElementById("dropzone");
const imagePreview = document.getElementById("image-preview");
const previewContainer = document.getElementById("image-preview-container");
const publishBtn = document.getElementById("publish-post-btn");
const captionInput = document.getElementById("post-caption");

let selectedFileBase64 = null;

// Modal Controls
openModalBtn?.addEventListener("click", () => uploadModal.classList.remove("hidden"));
closeModalBtn?.addEventListener("click", () => uploadModal.classList.add("hidden"));
dropzone?.addEventListener("click", () => imageInput.click());

imageInput?.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (file) {
    try {
      showToast("جاري معالجة وتصغير حجم الصورة...");
      selectedFileBase64 = await compressAndConvertToBase64(file, 1920, 1920, 0.8);
      imagePreview.src = selectedFileBase64;
      previewContainer.classList.remove("hidden");
      document.getElementById("dropzone-prompt").classList.add("hidden");
    } catch (err) {
      showToast("حدث خطأ أثناء معالجة الصورة.", "error");
    }
  }
});

// Publish Post
publishBtn?.addEventListener("click", async () => {
  const caption = captionInput.value.trim();
  const currentUser = auth.currentUser;

  if (!currentUser) return;
  if (!selectedFileBase64 && !caption) {
    showToast("يرجى إرفاق صورة أو كتابة نص للمنشور", "error");
    return;
  }

  const postsRef = ref(db, "posts");
  const newPostRef = push(postsRef);

  const postData = {
    id: newPostRef.key,
    userId: currentUser.uid,
    caption: caption,
    imageBase64: selectedFileBase64 || "",
    createdAt: Date.now(),
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0
  };

  try {
    await set(newPostRef, postData);
    showToast("تم نشر الصورة بنجاح 🚀");
    uploadModal.classList.add("hidden");
    // Reset Form
    captionInput.value = "";
    selectedFileBase64 = null;
    previewContainer.classList.add("hidden");
    document.getElementById("dropzone-prompt").classList.remove("hidden");
  } catch (err) {
    showToast("فشل النشر، أعد المحاولة.", "error");
  }
});

// Render Posts Feed
export function listenForPosts() {
  const postsRef = ref(db, "posts");
  onValue(postsRef, (snapshot) => {
    postsFeed.innerHTML = "";
    if (!snapshot.exists()) {
      postsFeed.innerHTML = `<div class="glass-card empty-feed">لا توجد منشورات حتى الآن. كن أول من يشارك صورة للسماء!</div>`;
      return;
    }

    const postsObj = snapshot.val();
    const postsArray = Object.values(postsObj).sort((a, b) => b.createdAt - a.createdAt);

    postsArray.forEach((post) => {
      const card = createPostCardElement(post);
      postsFeed.appendChild(card);
    });
  });
}

function createPostCardElement(post) {
  const card = document.createElement("article");
  card.className = "post-card glass-card";
  card.dataset.id = post.id;

  card.innerHTML = `
    <div class="post-header">
      <div class="post-author-info">
        <img src="https://cdn-icons-png.flaticon.com/128/149/149071.png" class="avatar-md author-avatar">
        <div>
          <div class="author-name-wrapper">
            <h4 class="author-name">مستخدم sky7</h4>
            <img src="/assets/images/facebook-verified.png" class="verified-badge" title="حساب موثق">
          </div>
          <span class="post-time">${new Date(post.createdAt).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</span>
        </div>
      </div>
      <button class="post-menu-btn">•••</button>
    </div>

    ${post.caption ? `<p class="post-caption">${post.caption}</p>` : ''}

    ${post.imageBase64 ? `
      <div class="post-image-wrapper">
        <img src="${post.imageBase64}" loading="lazy" class="post-main-image" alt="Sky photo">
      </div>
    ` : ''}

    <div class="post-stats">
      <div class="reactions-count">❤️ 😮 👍 <span class="reactions-num">${post.likesCount || 0}</span></div>
      <div>
        <span>${post.commentsCount || 0} تعليق</span>
      </div>
    </div>

    <div class="post-actions">
      <div class="reaction-wrapper">
        <button class="action-btn like-btn">👍 أعجبني</button>
        <div class="reaction-picker glass-card hidden">
          <img src="https://cdn-icons-png.flaticon.com/128/4926/4926585.png" data-type="LIKE" title="أعجبني">
          <img src="https://cdn-icons-png.flaticon.com/128/10307/10307888.png" data-type="LOVE" title="أحببته">
          <img src="https://cdn-icons-png.flaticon.com/128/17446/17446042.png" data-type="WOW" title="واو">
          <img src="https://cdn-icons-png.flaticon.com/128/889/889139.png" data-type="DISLIKE" title="لم يعجبني">
        </div>
      </div>
      <button class="action-btn comment-btn">💬 تعليق</button>
      <button class="action-btn save-btn" data-id="${post.id}">🔖 حفظ</button>
      <button class="action-btn download-btn" data-img="${post.imageBase64}">⬇️ تنزيل الصورة</button>
    </div>
  `;

  // التنزيل المباشر كملف صورة
  card.querySelector(".download-btn")?.addEventListener("click", (e) => {
    const base64Data = e.target.dataset.img;
    if (!base64Data) return;
    const a = document.createElement("a");
    a.href = base64Data;
    a.download = `sky7-image-${post.id}.jpg`;
    a.click();
    showToast("تم بدء تنزيل الصورة على جهازك");
  });

  return card;
}

export function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

listenForPosts();
