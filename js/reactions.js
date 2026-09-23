import { db, ref, set, get, auth } from "./firebase.js";
import { showToast } from "./posts.js";

// Event Delegation for dynamically loaded posts
document.addEventListener("click", async (e) => {
  if (e.target.closest(".reaction-picker img")) {
    const reactionType = e.target.dataset.type;
    const postCard = e.target.closest(".post-card");
    const postId = postCard.dataset.id;
    const userId = auth.currentUser?.uid;

    if (!userId) return;

    try {
      const reactionRef = ref(db, `reactions/${postId}/${userId}`);
      await set(reactionRef, { type: reactionType });
      
      // Update UI Reaction Count Optimistically
      const numSpan = postCard.querySelector(".reactions-num");
      numSpan.textContent = parseInt(numSpan.textContent) + 1;
      
      // Hide picker
      postCard.querySelector(".reaction-picker").classList.add("hidden");
      showToast(`تم التفاعل بـ ${reactionType}`, "success");
    } catch (err) {
      showToast("حدث خطأ أثناء تسجيل التفاعل.", "error");
    }
  }
});

// Show/Hide Reaction Picker on Hover
document.addEventListener("mouseover", (e) => {
  if (e.target.classList.contains("like-btn")) {
    const picker = e.target.nextElementSibling;
    picker.classList.remove("hidden");
  }
});
