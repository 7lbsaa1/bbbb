import { auth, db, ref, onValue, update } from "./firebase.js";
import { showToast } from "./posts.js"; // لإظهار تنبيه منبثق عند وصول إشعار جديد

export function initNotifications() {
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) return;

  const notifRef = ref(db, `notifications/${currentUserId}`);
  const notifBadge = document.getElementById("notif-badge"); // أيقونة الجرس في النافبار
  const notifDropdown = document.getElementById("notif-dropdown"); // قائمة منسدلة للإشعارات

  let isFirstLoad = true;

  onValue(notifRef, (snapshot) => {
    if (!snapshot.exists()) {
      if(notifBadge) notifBadge.style.display = "none";
      if(notifDropdown) notifDropdown.innerHTML = `<div class="empty-notif">لا توجد إشعارات</div>`;
      return;
    }

    const notifications = snapshot.val();
    const notifArray = Object.entries(notifications).map(([id, data]) => ({ id, ...data }));
    
    // الفلترة لغير المقروءة
    const unread = notifArray.filter(n => !n.read);

    // تحديث الأيقونة (Badge)
    if (notifBadge) {
      if (unread.length > 0) {
        notifBadge.textContent = unread.length;
        notifBadge.style.display = "flex";
      } else {
        notifBadge.style.display = "none";
      }
    }

    // إظهار تنبيه منبثق إذا جاء إشعار جديد بعد التحميل الأولي
    if (!isFirstLoad && unread.length > 0) {
      const latestNotif = unread.sort((a,b) => b.timestamp - a.timestamp)[0];
      showToast(latestNotif.message, "info");
    }

    // بناء واجهة القائمة المنسدلة
    if (notifDropdown) {
      notifDropdown.innerHTML = "";
      notifArray.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10).forEach(notif => {
        const item = document.createElement("div");
        item.className = `notif-item ${notif.read ? 'read' : 'unread'}`;
        item.innerHTML = `
          <div class="notif-content">${notif.message}</div>
          <div class="notif-time">${new Date(notif.timestamp).toLocaleTimeString()}</div>
        `;
        
        // عند النقر، نجعلها "مقروءة"
        item.addEventListener("click", () => {
          update(ref(db, `notifications/${currentUserId}/${notif.id}`), { read: true });
          // هنا يمكن توجيه المستخدم حسب نوع الإشعار (مثال: فتح المنشور أو الملف الشخصي)
        });

        notifDropdown.appendChild(item);
      });
    }

    isFirstLoad = false;
  });
}
