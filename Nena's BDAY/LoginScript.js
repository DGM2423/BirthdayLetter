document.getElementById("loginForm").addEventListener("submit", function(event) {
  event.preventDefault(); // stop the form from submitting normally

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // hardcoded credentials (for demo only)
  const validUsername = "ElenaGuadianaValenzuela";
  const validPassword = "092303";

  if (username === validUsername && password === validPassword) {
    // redirect to next page
    window.location.href = "HappyBirthday.html";
  } else {
    document.getElementById("error").textContent = "Invalid username or password";
  }
});
