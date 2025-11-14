import * as functions from "firebase-functions";
import admin from "firebase-admin";
admin.initializeApp();
const db = admin.firestore();

export const submitConsult = functions.https.onRequest(async (req, res) => {
  try {
    // ✅ CORS 설정
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(204).send("");

    const { name, phone, debt, payment, message } = req.body || {};

    if (!name || !phone || !message) {
      return res.status(400).send("입력값이 부족합니다.");
    }

    // ✅ IP 가져오기
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      "unknown";

    // ✅ IP 중복 검사
    const ipDoc = await db.collection("ipRecords").doc(ip).get();
    if (ipDoc.exists) {
      console.log("⚠️ 중복 IP 차단:", ip);
      return res
        .status(403)
        .send("이미 상담 신청이 완료된 IP입니다. 중복 접수가 제한됩니다.");
    }

    // ✅ IP 기록 저장
    await db.collection("ipRecords").doc(ip).set({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // ✅ 상담 내용 저장
    await db.collection("consultRequests").add({
      name,
      phone,
      debt,
      payment,
      message,
      ip,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✅ Firestore 저장 완료:", name, phone);
    return res.status(200).send("상담 신청이 정상적으로 접수되었습니다!");
  } catch (err) {
    console.error("🔥 오류:", err);
    return res.status(500).send("서버 오류가 발생했습니다.");
  }
});