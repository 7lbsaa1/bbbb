import {
  auth,
  db,
  ref,
  set,
  get,
  child,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "./firebase.js";

// عناصر الواجهة
const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

// التبديل بين التبويبات (Tabs)
tabLogin?.addEventListener("click", () => {
  tabLogin.classList.add("active");
  tabRegister.classList.remove("active");
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
});

tabRegister?.addEventListener("click", () => {
  tabRegister.classList.add("active");
  tabLogin.classList.remove("active");
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
});

// التوجيه التلقائي في حال كان المستخدم مسجلاً بالفعل
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "home.html";
  }
});

// 1. تسجيل الدخول
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const submitBtn = loginForm.querySelector("button[type='submit']");

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "جاري الدخول...";

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // التحقق مما إذا كان الحساب محظوراً من قبل الإدارة
    const userSnap = await get(child(ref(db), `users/${user.uid}`));
    if (userSnap.exists() && userSnap.val().blocked) {
      showToast("هذا الحساب محظور من قبل الإدارة", "error");
      await auth.signOut();
      return;
    }

    showToast("تم تسجيل الدخول بنجاح", "success");
    setTimeout(() => {
      window.location.href = "home.html";
    }, 1000);
  } catch (error) {
    handleAuthError(error);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "دخول";
  }
});

// 2. إنشاء حساب جديد
registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fullName = document.getElementById("reg-fullname").value.trim();
  const username = document.getElementById("reg-username").value.trim().toLowerCase();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const submitBtn = registerForm.querySelector("button[type='submit']");

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "جاري إنشاء الحساب...";

    // إنشاء الحساب في Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // حفظ البيانات الأساسية للمستخدم في Realtime Database
    const userData = {
      uid: user.uid,
      name: fullName,
      username: username,
      email: email,
      profileImage: "https://cdn-icons-png.flaticon.com/128/149/149071.png",
      verified: false,
      blocked: false,
      createdAt: Date.now()
    };

    await set(ref(db, `users/${user.uid}`), userData);

    showToast("تم إنشاء الحساب بنجاح!", "success");
    setTimeout(() => {
      window.location.href = "home.html";
    }, 1000);
  } catch (error) {
    handleAuthError(error);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "إنشاء الحساب";
  }
});

// دالة عرض التنبيهات المنبثقة (Toast)
export function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.style.cssText = `
    background: ${type === 'error' ? '#ff4757' : type === 'success' ? '#2ed573' : 'var(--accent-color)'};
    color: #fff;
    padding: 12px 20px;
    border-radius: 8px;
    margin-top: 10px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    font-size: 0.9rem;
    animation: fadeIn 0.3s ease;
  `;
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

// ترجمة أخطاء Firebase Auth إلى العربية
function handleAuthError(error) {
  let message = "حدث خطأ غير متوقع، حاول مرة أخرى.";
  switch (error.code) {
    case "auth/email-already-in-use":
      message = "البريد الإلكتروني مستخدم بالفعل.";
      break;
    case "auth/invalid-email":
      message = "صيغة البريد الإلكتروني غير صحيحة.";
      break;
    case "auth/weak-password":
      message = "كلمة المرور ضعيفة جداً.";
      break;
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      message = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
      break;
    case "auth/too-many-requests":
      message = "تم إيقاف المحاولات مؤقتاً لكثرة المحاولات الخاطئة.";
      break;
  }
  showToast(message, "error");
}
