import React from "react";
import DeleteAccountClient from "../../components/legal/DeleteAccountClient";

export const metadata = {
  title: "Hesap Silme — Hesabımı ve Verilerimi Sil",
  description:
    "Memolandum (com.memolandum.app) kullanıcı hesabı ve kişisel verileri kalıcı silme sayfası.",
  alternates: {
    canonical: "https://memolandum.com/delete-account/",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function HesapSilmePage() {
  return <DeleteAccountClient />;
}
