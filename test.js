(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/weather?lat=28.12&lon=-15.43');
    const data = await res.text();
    console.log("STATUS:", res.status);
    console.log("DATA (length):", data.length);
    console.log("DATA snippet:", data.substring(0, 100));
  } catch(e) {
    console.log("ERROR:", e);
  }
})();
