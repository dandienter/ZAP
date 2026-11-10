import { NextResponse } from "next/server";
import {
  ADMIN_EMAIL,
  ADMIN_SECRET,
  getUserSecurityStatus,
  unsuspendUserAccount,
  createRecoveryToken,
  verifyRecoveryToken,
  loadRegistryFromFile,
} from "@/utils/security-vault";

// GET Handler
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const email = searchParams.get("email") || "";
    const token = searchParams.get("token") || "";
    const adminKey = searchParams.get("secret") || "";

    // 1. Verifikasi Token Pemulihan (untuk link email siswa: ?unban_token=...)
    if (token) {
      const verified = verifyRecoveryToken(token);
      if (verified.valid) {
        const targetEmail = verified.email || email;
        if (targetEmail) {
          unsuspendUserAccount(targetEmail, "Recovery Token");
        }
        return NextResponse.json({
          success: true,
          message: "Akun Anda berhasil dipulihkan secara penuh! Silakan buka kembali ChatZAP.",
          email: targetEmail,
        });
      }
      return NextResponse.json(
        { success: false, message: "Token pemulihan tidak valid atau sudah kedaluwarsa." },
        { status: 400 }
      );
    }

    // 2. Cek status akun pengguna
    if (action === "check" && email) {
      const status = getUserSecurityStatus(email);
      return NextResponse.json(status);
    }

    // 3. Admin: List suspended users
    if (action === "list") {
      const isAdmin = adminKey === ADMIN_SECRET || email.toLowerCase() === ADMIN_EMAIL;
      if (!isAdmin) {
        return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
      }
      const all = loadRegistryFromFile();
      const list = Object.values(all);
      return NextResponse.json({ list });
    }

    return NextResponse.json({ error: "Parameter tidak lengkap" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST Handler: Admin Actions (Unban, Generate Token, Verify)
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, email, adminEmail, adminSecret, token } = body;

    // A. Siswa memasukkan token pemulihan dari email
    if (action === "verify_token" || action === "redeem_token") {
      const verified = verifyRecoveryToken(token);
      if (!verified.valid) {
        return NextResponse.json(
          { success: false, message: "Kode pemulihan tidak valid atau telah kedaluwarsa." },
          { status: 400 }
        );
      }

      const targetEmail = verified.email || email;
      if (targetEmail) {
        unsuspendUserAccount(targetEmail, "Token Verifikasi");
      }

      return NextResponse.json({
        success: true,
        message: "Akun berhasil dipulihkan! Akses ChatZAP Anda telah aktif kembali.",
        email: targetEmail,
      });
    }

    // B. Verifikasi Hak Admin
    const isSuperAdmin =
      (adminEmail && adminEmail.toLowerCase().trim() === ADMIN_EMAIL) ||
      (adminSecret && adminSecret.trim() === ADMIN_SECRET);

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Otorisasi ditolak. Tindakan ini hanya dapat dilakukan oleh Administrator resmi." },
        { status: 403 }
      );
    }

    // C. Admin Unsuspend Akun secara langsung berdasarkan email
    if (action === "unban" || action === "unsuspend") {
      if (!email) {
        return NextResponse.json({ error: "Email pengguna yang ingin di-unban diperlukan." }, { status: 400 });
      }

      unsuspendUserAccount(email, adminEmail || "Superadmin Wakhid");
      const recoveryToken = createRecoveryToken(email);

      return NextResponse.json({
        success: true,
        message: `Akun ${email} berhasil dipulihkan secara resmi di server!`,
        email,
        recoveryToken,
        recoveryUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/chat?unban_token=${encodeURIComponent(recoveryToken)}`,
      });
    }

    // D. Admin generate recovery link / token untuk dibalas ke email siswa
    if (action === "generate_recovery") {
      if (!email) {
        return NextResponse.json({ error: "Email diperlukan." }, { status: 400 });
      }

      const recoveryToken = createRecoveryToken(email);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const recoveryUrl = `${appUrl}/chat?unban_token=${encodeURIComponent(recoveryToken)}`;

      return NextResponse.json({
        success: true,
        email,
        recoveryToken,
        recoveryUrl,
        emailTemplate: `Halo,\n\nPermohonan pemulihan akun ChatZAP Anda (${email}) telah disetujui oleh Administrator.\n\nKlik tautan berikut untuk memulihkan akun Anda secara otomatis:\n${recoveryUrl}\n\nAtau gunakan kode pemulihan berikut:\n${recoveryToken}\n\nSalam,\nWakhid Pangestu\nChatZAP Administrator`,
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
