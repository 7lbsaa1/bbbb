import { auth, db, ref, get, update, query, orderByChild, equalTo, onAuthStateChanged } from "./firebase.js";
import { compressAndConvertToBase64 } from "./imageCompression.js";
import { showToast } from "./posts.js"; // افتراض إمكانية استيراد دالة Toast

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    loadUserProfile();
    loadUserPosts();
  }
});

async function loadUserProfile() {
  const userRef = ref(db, `users/${currentUser.uid}`);
  const snapshot = await get(userRef);
  if (snapshot.exists()) {
    const data = snapshot.val();
    document.getElementById("profile-name").childNodes[0].nodeValue = data.name + " ";
    document.getElementById("profile-username").textContent = "@" + data.username;
    
    if (data.profileImage) document.getElementById("profile-avatar").src = data.profileImage;
    if (data.coverImage) document.getElementById("profile-cover").src = data.coverImage;
    if (data.bio) document.getElementById("profile-bio-text").textContent = data.bio;
    if (data.verified) document.getElementById("profile-verified").classList.remove("hidden");
  }
}

async function loadUserPosts() {
  const postsRef = query(ref(db, "posts"), orderByChild("userId"), equalTo(currentUser.uid));
  const snapshot = await get(postsRef);
  const feed = document.getElementById("user-posts-feed");
  feed.innerHTML = "";
  
  if (snapshot.exists()) {
    const posts = Object.values(snapshot.val()).sort((a, b) => b.createdAt - a.createdAt);
    document.getElementById("stat-posts").textContent = posts.length;
    
    posts.forEach(post => {
      // نفس لوجيك إنشاء الـ Card الموجود في posts.js (يمكن فصله في ملف Utils لتفادي التكرار)
      const div = document.createElement("div");
      div.className = "post-card glass-card";
      div.innerHTML = `
        <div class="post-header">
           <span class="post-time">${new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
        ${post.caption ? `<p>${post.caption}</p>` : ''}
        ${post.imageBase64 ? `<img src="${post.imageBase64}" class="post-main-image">` : ''}
      `;
      feed.appendChild(div);
    });
  } else {
    feed.innerHTML = `<div class="glass-card empty-feed">ليس لديك أي منشورات بعد.</div>`;
  }
}

// Edit Modal Logic
const editModal = document.getElementById("edit-profile-modal");
document.getElementById("edit-profile-btn")?.addEventListener("click", () => editModal.classList.remove("hidden"));
document.getElementById("close-edit-modal")?.addEventListener("click", () => editModal.classList.add("hidden"));

document.getElementById("save-profile-btn")?.addEventListener("click", async () => {
  const bio = document.getElementById("edit-bio").value;
  const file = document.getElementById("edit-avatar-file").files[0];
  const updates = {};
  
  if (bio) updates.bio = bio;
  
  if (file) {
    try {
      const base64 = await compressAndConvertToBase64(file, 500, 500, 0.8);
      updates.profileImage = base64;
    } catch (e) {
      showToast("خطأ في معالجة الصورة", "error");
      return;
    }
  }

  await update(ref(db, `users/${currentUser.uid}`), updates);
  showToast("تم تحديث الملف الشخصي!");
  editModal.classList.add("hidden");
  loadUserProfile();
});
