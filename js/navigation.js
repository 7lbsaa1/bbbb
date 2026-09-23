import { auth, db, ref, get, child, onAuthStateChanged } from "./firebase.js";

// تحويل روابط المسارات القديمة للمسارات النظيفة
export function cleanNavigate(path) {
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  window.history.pushState({}, "", cleanPath);
  handleRoute(cleanPath);
}

// مراجعة الروابط والتسجيل العام لحدث الضغط على أي رابط بالـ App
document.addEventListener("click", (e) => {
  const anchor = e.target.closest("a");
  if (anchor && anchor.getAttribute("href")) {
    const href = anchor.getAttribute("href");
    
    // تصحيح الرابط إذا كان يضم .html
    if (href.endsWith(".html")) {
      e.preventDefault();
      const newPath = href.replace(".html", "");
      cleanNavigate(newPath === "index" ? "/home" : newPath);
    } else if (href.startsWith("/")) {
      e.preventDefault();
      cleanNavigate(href);
    }
  }
});

// فحص أمان الجلسات والتوجيه حسب الحظر والمصادقة
export function initAuthGuard() {
  onAuthStateChanged(auth, async (user) => {
    const currentPath = window.location.pathname.replace(".html", "");

    if (user) {
      // جلب حالة الحظر للمستخدم
      const snapshot = await get(child(ref(db), `users/${user.uid}`));
      if (snapshot.exists()) {
        const userData = snapshot.val();
        if (userData.blocked && currentPath !== "/block") {
          window.location.href = "/block";
          return;
        }
      }

      if (currentPath === "/login" || currentPath === "/registration" || currentPath === "/") {
        window.location.href = "/home";
      }
    } else {
      if (currentPath !== "/login" && currentPath !== "/registration" && currentPath !== "/block") {
        window.location.href = "/login";
      }
    }
  });
}

function handleRoute(path) {
  // محاكاة تنقل الصفحات أو تحميل شاشات الموديول المناسب
  console.log(`Mapsd to: ${path}`);
}

// تشغيل الفحص فور إقلاع التطبيق
initAuthGuard();
