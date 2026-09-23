import { auth, db, ref, set, get, child, remove, onAuthStateChanged } from "./firebase.js";
import { showToast } from "./posts.js";

// 1. منطق زر "حفظ" داخل أي Post (يعمل في جميع الصفحات)
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("save-btn")) {
    const user = auth.currentUser;
    if (!user) return;
    
    const postId = e.target.dataset.id;
    const favRef = ref(db, `favorites/${user.uid}/${postId}`);
    
    // التحقق إذا كان محفوظاً من قبل
    const snapshot = await get(favRef);
    if (snapshot.exists()) {
      await remove(favRef);
      e.target.textContent = "🔖 حفظ";
      e.target.style.color = "";
      showToast("تم إزالة المنشور من المفضلة");
    } else {
      await set(favRef, { savedAt: Date.now() });
      e.target.textContent = "✅ محفوظ";
      e.target.style.color = "var(--accent-color)";
      showToast("تم الحفظ في المفضلة");
    }
  }
});

// 2. عرض المنشورات في صفحة favorite.html
const favoritesFeed = document.getElementById("favorites-feed");
if (favoritesFeed) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const favRef = ref(db, `favorites/${user.uid}`);
      const snapshot = await get(favRef);
      
      favoritesFeed.innerHTML = "";
      if (!snapshot.exists()) {
        favoritesFeed.innerHTML = `<div class="glass-card empty-feed">لم تقم بحفظ أي صور بعد.</div>`;
        return;
      }

      const savedPostsIds = Object.keys(snapshot.val());
      
      savedPostsIds.forEach(async (postId) => {
        const postSnap = await get(child(ref(db), `posts/${postId}`));
        if (postSnap.exists()) {
          const post = postSnap.val();
          renderSavedPost(post);
        }
      });
    }
  });
}

function renderSavedPost(post) {
  const div = document.createElement("div");
  div.className = "post-card glass-card";
  div.innerHTML = `
    <div class="post-header">
      <span class="post-time">${new Date(post.createdAt).toLocaleDateString()}</span>
    </div>
    ${post.caption ? `<p>${post.caption}</p>` : ''}
    ${post.imageBase64 ? `<img src="${post.imageBase64}" class="post-main-image">` : ''}
    <div style="margin-top: 15px; text-align: left;">
      <a href="/home" class="btn-secondary" style="font-size: 0.8rem;">الذهاب للمنشور الأصلي</a>
    </div>
  `;
  favoritesFeed.appendChild(div);
}
