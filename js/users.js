import { auth, db, ref, get, set, child, onAuthStateChanged } from "./firebase.js";
import { showToast } from "./posts.js";

const usersContainer = document.getElementById("users-container");
const searchInput = document.getElementById("search-users");
let allUsers = [];

onAuthStateChanged(auth, async (user) => {
  if (user) {
    loadAllUsers(user.uid);
  }
});

async function loadAllUsers(currentUserId) {
  const usersRef = ref(db, "users");
  const snapshot = await get(usersRef);
  
  if (snapshot.exists()) {
    const data = snapshot.val();
    // استبعاد حساب المستخدم الحالي والحسابات المحظورة
    allUsers = Object.values(data).filter(u => u.uid !== currentUserId && !u.blocked);
    renderUsers(allUsers);
  }
}

function renderUsers(usersToRender) {
  if (!usersContainer) return;
  usersContainer.innerHTML = "";
  
  if (usersToRender.length === 0) {
    usersContainer.innerHTML = `<div style="grid-column: 1/-1;" class="glass-card empty-feed">لا يوجد مستخدمين لعرضهم.</div>`;
    return;
  }

  usersToRender.forEach(user => {
    const card = document.createElement("div");
    card.className = "user-card glass-card";
    
    card.innerHTML = `
      <img src="${user.profileImage || 'https://cdn-icons-png.flaticon.com/128/149/149071.png'}" alt="avatar">
      <h4>${user.name} ${user.verified ? '<img src="/assets/images/facebook-verified.png" class="verified-badge" width="14">' : ''}</h4>
      <p class="subtitle" style="font-size: 0.8rem; margin-bottom: 15px;">@${user.username}</p>
      <button class="btn-primary add-friend-btn" data-uid="${user.uid}" style="font-size: 0.8rem; width: 100%;">إضافة صديق</button>
    `;
    usersContainer.appendChild(card);
  });
}

// محرك البحث الحي (Live Search)
searchInput?.addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = allUsers.filter(u => 
    u.name.toLowerCase().includes(term) || 
    u.username.toLowerCase().includes(term)
  );
  renderUsers(filtered);
});

// إرسال طلب صداقة
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("add-friend-btn")) {
    const currentUserId = auth.currentUser.uid;
    const targetUid = e.target.dataset.uid;
    
    try {
      // تسجيل الطلب في عقدة friendRequests
      await set(ref(db, `friendRequests/${targetUid}/${currentUserId}`), {
        from: currentUserId,
        status: "pending",
        timestamp: Date.now()
      });
      
      e.target.textContent = "تم إرسال الطلب";
      e.target.disabled = true;
      e.target.style.background = "var(--text-dim)";
      showToast("تم إرسال طلب الصداقة بنجاح", "success");
    } catch (err) {
      showToast("حدث خطأ أثناء الإرسال", "error");
    }
  }
});
