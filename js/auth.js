import { 
  auth, db, ref, set, get, child, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "./firebase.js";

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ترجمة أخطاء Firebase
function handleAuthError(error) {
  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return "بيانات تسجيل الدخول غير صحيحة.";
    case 'auth/email-already-in-use':
      return "البريد الإلكتروني مستخدم بالفعل.";
    case 'auth/weak-password':
      return "كلمة المرور ضعيفة جدًا، استخدم 6 أحرف على الأقل.";
    default:
      return "حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.";
  }
}

// Toggle Password Visibility
const togglePwd = document.getElementById("toggle-pwd");
const pwdInput = document.getElementById("password");
if (togglePwd && pwdInput) {
  togglePwd.addEventListener("click", () => {
    const type = pwdInput.getAttribute("type") === "password" ? "text" : "password";
    pwdInput.setAttribute("type", type);
  });
}

// Login Logic
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const loginBtn = document.getElementById("login-btn");

    loginBtn.textContent = "جاري التحقق...";
    loginBtn.disabled = true;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // التحقق من الحظر
      const snapshot = await get(child(ref(db), `users/${user.uid}`));
      if (snapshot.exists() && snapshot.val().blocked) {
        window.location.href = "/block";
      } else {
        window.location.href = "/home";
      }
    } catch (error) {
      showToast(handleAuthError(error), "error");
      loginBtn.textContent = "تسجيل الدخول";
      loginBtn.disabled = false;
    }
  });
}

// Registration Logic
const regForm = document.getElementById("register-form");
if (regForm) {
  regForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("reg-name").value.trim();
    const username = document.getElementById("reg-username").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;
    const confirm = document.getElementById("reg-confirm").value;
    const regBtn = document.getElementById("reg-btn");

    if (password !== confirm) {
      showToast("كلمات المرور غير متطابقة", "error");
      return;
    }

    regBtn.textContent = "جاري إنشاء الحساب...";
    regBtn.disabled = true;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // حفظ بيانات المستخدم في Realtime Database
      await set(ref(db, 'users/' + user.uid), {
        uid: user.uid,
        name: name,
        username: username,
        email: email,
        profileImage: "https://cdn-icons-png.flaticon.com/128/149/149071.png", // Default Avatar
        coverImage: "",
        bio: "",
        verified: false,
        blocked: false,
        createdAt: Date.now()
      });

      showToast("تم إنشاء الحساب بنجاح! جاري التوجيه...");
      setTimeout(() => window.location.href = "/profile", 1500);

    } catch (error) {
      showToast(handleAuthError(error), "error");
      regBtn.textContent = "إنشاء الحساب";
      regBtn.disabled = false;
    }
  });
}
