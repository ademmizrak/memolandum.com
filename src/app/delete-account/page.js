import React from "react";
import DeleteAccountClient from "../../components/legal/DeleteAccountClient";

export const metadata = {
  title: "Hesabımı ve Verilerimi Sil (Delete Account)",
  description:
    "Memolandum (com.memolandum.app) kullanıcı hesabı ve kişisel verileri (Kelime Kasası, Öğretmen Masası, ilerleme kayıtları) kalıcı silme sayfası.",
  alternates: {
    canonical: "https://memolandum.com/delete-account/",
  },
};

export default function DeleteAccountPage() {
  return <DeleteAccountClient />;
}
