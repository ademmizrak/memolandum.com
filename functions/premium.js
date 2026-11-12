/**
 * Memolandum Premium — güvenli ödeme
 * TR: Shopier PAT (hosted checkout + REST webhook)
 * Global: Stripe
 * iyzico / klasik OSB: opsiyonel yedek
 */

const crypto = require("crypto");
const admin = require("firebase-admin");
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const { ShopierApiClient, verifyAndParseWebhook } = require("@nopeion/shopier");
const Iyzipay = require("iyzipay");

const shopierPat = defineSecret("SHOPIER_PAT");
const shopierWebhookToken = defineSecret("SHOPIER_WEBHOOK_TOKEN");

const PERIOD_DAYS = Number(process.env.PREMIUM_PERIOD_DAYS || 30);
const AMOUNT_TRY = Number(process.env.PREMIUM_AMOUNT_TRY || 199);
const SITE_URL = process.env.PREMIUM_SITE_URL || "https://memolandum.com";
const PROJECT_ID = process.env.GCLOUD_PROJECT || "memolandum-33dc4";
const SHOPIER_PAY_URL = "https://www.shopier.com/ShowProduct/api_pay4.php";
const SHOPIER_CURRENCY = { TRY: 0, USD: 1, EUR: 2 };
const SHOPIER_PRODUCT_DIGITAL = 1;

const DEFAULT_PRODUCT_ID = process.env.SHOPIER_PRODUCT_ID || "49186522";
const DEFAULT_SHOP_SLUG = process.env.SHOPIER_SHOP_SLUG || "memolandum";
const DEFAULT_PRODUCT_IMAGE =
  process.env.SHOPIER_PRODUCT_IMAGE_URL ||
  "https://cdn.shopier.app/pictures_large/memolandum_65b88f72-57d5-4d1f-842b-6c8cdb190274.jpg";

function db() {
  return getFirestore();
}

function shopierOsbCallbackUrl() {
  return (
    process.env.SHOPIER_CALLBACK_URL ||
    `https://us-central1-${PROJECT_ID}.cloudfunctions.net/shopierPremiumCallback`
  );
}

function getPat() {
  return process.env.SHOPIER_PAT || null;
}

function getWebhookToken() {
  return process.env.SHOPIER_WEBHOOK_TOKEN || null;
}

function getShopierOsbCredentials() {
  const apiKey = process.env.SHOPIER_API_KEY;
  const apiSecret = process.env.SHOPIER_API_SECRET;
  if (!apiKey || !apiSecret) return null;
  return { apiKey, apiSecret };
}

function shopierHmacBase64(data, apiSecret) {
  return crypto.createHmac("sha256", apiSecret).update(String(data), "utf8").digest("base64");
}

function timingSafeEqualStr(a, b) {
  try {
    const ba = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

function verifyShopierOsbCallback(body, apiSecret) {
  const randomNr = body.random_nr ?? "";
  const orderId = body.platform_order_id ?? "";
  const total = body.total_order_value ?? "";
  const currency = body.currency ?? "";
  const signature = body.signature;
  if (!signature || !orderId) return false;

  const payloads = [`${randomNr}${orderId}`, `${randomNr}${orderId}${total}${currency}`];
  for (const payload of payloads) {
    if (timingSafeEqualStr(shopierHmacBase64(payload, apiSecret), signature)) return true;
    try {
      const decoded = Buffer.from(String(signature), "base64");
      const raw = crypto.createHmac("sha256", apiSecret).update(payload, "utf8").digest();
      if (decoded.length === raw.length && crypto.timingSafeEqual(decoded, raw)) return true;
    } catch {
      /* continue */
    }
  }
  return false;
}

function buildShopierOsbFormFields({ apiKey, apiSecret, orderId, amount, email, firstName, lastName, uid }) {
  const total = Number(amount).toFixed(2);
  const currency = SHOPIER_CURRENCY.TRY;
  const randomNr = String(Math.floor(100000 + Math.random() * 900000));
  const signature = shopierHmacBase64(`${randomNr}${orderId}${total}${currency}`, apiSecret);
  const phone = process.env.SHOPIER_DEFAULT_PHONE || "05000000000";
  const buyerId = String(uid).replace(/[^a-zA-Z0-9]/g, "").slice(0, 32) || "buyer";

  return {
    API_key: apiKey,
    website_index: Number(process.env.SHOPIER_WEBSITE_INDEX || 1),
    platform_order_id: orderId,
    product_name: "Memolandum Premium — AI Ceviri",
    product_type: SHOPIER_PRODUCT_DIGITAL,
    buyer_name: firstName,
    buyer_surname: lastName,
    buyer_email: email,
    buyer_account_age: 0,
    buyer_id_nr: buyerId,
    buyer_phone: phone,
    billing_address: "Istanbul, Turkiye",
    billing_city: "Istanbul",
    billing_country: "TR",
    billing_postcode: "34000",
    shipping_address: "Istanbul, Turkiye",
    shipping_city: "Istanbul",
    shipping_country: "TR",
    shipping_postcode: "34000",
    total_order_value: total,
    currency,
    platform: 0,
    is_in_frame: 0,
    current_language: 0,
    modul_version: "1.0.4",
    random_nr: randomNr,
    signature,
    callback: shopierOsbCallbackUrl(),
  };
}

function buildHostedCheckoutFields(productId, shopSlug = DEFAULT_SHOP_SLUG) {
  return {
    formAction: `https://www.shopier.com/s/shipping/${encodeURIComponent(shopSlug)}`,
    formFields: {
      product_id: String(productId),
      quantity: "1",
    },
  };
}

async function activatePremium(uid, meta = {}) {
  const until = new Date();
  until.setDate(until.getDate() + PERIOD_DAYS);
  await db()
    .collection("users")
    .doc(uid)
    .collection("billing")
    .doc("subscription")
    .set(
      {
        status: "active",
        productId: "memolandum_premium_monthly",
        premiumUntil: Timestamp.fromDate(until),
        provider: meta.provider || null,
        externalId: meta.externalId || null,
        lastPaymentAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        amount: meta.amount || null,
        currency: meta.currency || null,
      },
      { merge: true }
    );
  return until;
}

async function resolveUidFromShopierOrder(order) {
  const email = String(order?.billingInfo?.email || order?.shippingInfo?.email || "")
    .trim()
    .toLowerCase();
  const productIds = (order?.lineItems || [])
    .map((li) => String(li.productId || ""))
    .filter(Boolean);

  for (const productId of productIds) {
    const byProduct = await db()
      .collection("premiumCheckouts")
      .where("productId", "==", productId)
      .where("status", "==", "pending")
      .limit(5)
      .get();
    if (!byProduct.empty) {
      const doc = byProduct.docs.sort(
        (a, b) => (b.data().createdAtMs || 0) - (a.data().createdAtMs || 0)
      )[0];
      return { uid: doc.data().uid, checkoutId: doc.id, via: "productId" };
    }
  }

  if (email) {
    const byEmail = await db()
      .collection("premiumCheckouts")
      .where("email", "==", email)
      .where("status", "==", "pending")
      .limit(10)
      .get();
    if (!byEmail.empty) {
      const doc = byEmail.docs.sort(
        (a, b) => (b.data().createdAtMs || 0) - (a.data().createdAtMs || 0)
      )[0];
      return { uid: doc.data().uid, checkoutId: doc.id, via: "email" };
    }

    try {
      const user = await admin.auth().getUserByEmail(email);
      return { uid: user.uid, checkoutId: null, via: "authEmail" };
    } catch {
      /* no auth user */
    }
  }

  return null;
}

function getIyzipay() {
  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  if (!apiKey || !secretKey) return null;
  return new Iyzipay({
    apiKey,
    secretKey,
    uri: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
  });
}

function requireIyzipay() {
  const iyzi = getIyzipay();
  if (!iyzi) {
    throw new HttpsError(
      "failed-precondition",
      "iyzico anahtarları yok. Firebase secrets: IYZICO_API_KEY, IYZICO_SECRET_KEY."
    );
  }
  return iyzi;
}

function iyzipayCreate(createFn, request) {
  const iyzi = requireIyzipay();
  return new Promise((resolve, reject) => {
    createFn(iyzi, request, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

exports.createPremiumCheckout = onCall(
  {
    region: "us-central1",
    secrets: [shopierPat, shopierWebhookToken],
    enforceAppCheck: false,
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Premium için giriş yapmalısınız.");
    }
    const uid = request.auth.uid;
    const provider = request.data?.provider;
    const email = request.auth.token?.email || `${uid}@users.memolandum.local`;
    const name = request.auth.token?.name || "Memolandum User";
    const parts = String(name).trim().split(/\s+/);
    const firstName = parts[0] || "User";
    const lastName = parts.slice(1).join(" ") || "Memolandum";

    if (provider === "shopier") {
      const pat = getPat();
      const osb = getShopierOsbCredentials();
      const orderId = `mm_${uid}_${Date.now()}`;
      const createdAtMs = Date.now();

      // 1) PAT + sabit ürün (önerilen)
      if (pat && DEFAULT_PRODUCT_ID) {
        const checkout = buildHostedCheckoutFields(DEFAULT_PRODUCT_ID, DEFAULT_SHOP_SLUG);
        await db().collection("premiumCheckouts").doc(orderId).set({
          uid,
          email: String(email).toLowerCase(),
          provider: "shopier",
          mode: "pat_fixed_product",
          productId: String(DEFAULT_PRODUCT_ID),
          amount: AMOUNT_TRY,
          currency: "TRY",
          status: "pending",
          createdAtMs,
          createdAt: FieldValue.serverTimestamp(),
        });

        return {
          provider: "shopier",
          ...checkout,
          checkoutUrl: `https://www.shopier.com/${DEFAULT_PRODUCT_ID}`,
          orderId,
          productId: String(DEFAULT_PRODUCT_ID),
        };
      }

      // 2) PAT ile sipariş başına ürün (ephemeral)
      if (pat) {
        try {
          const client = new ShopierApiClient({ pat });
          const product = await client.products.create({
            title: `Memolandum Premium — ${orderId.slice(-8)}`,
            description: `Firebase uid: ${uid}. Siparis: ${orderId}`,
            type: "digital",
            shippingPayer: "sellerPays",
            stockQuantity: 1,
            customListing: true,
            customNote: orderId,
            priceData: { currency: "TRY", price: AMOUNT_TRY.toFixed(2) },
            media: [{ type: "image", url: DEFAULT_PRODUCT_IMAGE, placement: 1 }],
          });

          const checkout = buildHostedCheckoutFields(product.id, DEFAULT_SHOP_SLUG);
          await db().collection("premiumCheckouts").doc(orderId).set({
            uid,
            email: String(email).toLowerCase(),
            provider: "shopier",
            mode: "pat_ephemeral",
            productId: String(product.id),
            amount: AMOUNT_TRY,
            currency: "TRY",
            status: "pending",
            createdAtMs,
            createdAt: FieldValue.serverTimestamp(),
          });

          return {
            provider: "shopier",
            ...checkout,
            checkoutUrl: product.url || `https://www.shopier.com/${product.id}`,
            orderId,
            productId: String(product.id),
          };
        } catch (e) {
          console.error("shopier PAT product create:", e?.message || e);
          throw new HttpsError(
            "internal",
            e?.message || "Shopier ürün/ödeme oturumu açılamadı."
          );
        }
      }

      // 3) Klasik OSB API key/secret
      if (osb) {
        const formFields = buildShopierOsbFormFields({
          apiKey: osb.apiKey,
          apiSecret: osb.apiSecret,
          orderId,
          amount: AMOUNT_TRY,
          email,
          firstName,
          lastName,
          uid,
        });
        await db().collection("premiumCheckouts").doc(orderId).set({
          uid,
          email: String(email).toLowerCase(),
          provider: "shopier",
          mode: "osb_form",
          amount: AMOUNT_TRY,
          currency: "TRY",
          status: "pending",
          createdAtMs,
          createdAt: FieldValue.serverTimestamp(),
        });
        return {
          provider: "shopier",
          formAction: SHOPIER_PAY_URL,
          formFields,
          orderId,
        };
      }

      throw new HttpsError(
        "failed-precondition",
        "Shopier PAT yapılandırılmadı. Firebase secret: SHOPIER_PAT"
      );
    }

    if (provider === "iyzico") {
      const callbackUrl =
        process.env.IYZICO_CALLBACK_URL ||
        `https://us-central1-${PROJECT_ID}.cloudfunctions.net/iyzicoPremiumCallback`;

      const conversationId = `mm_${uid}_${Date.now()}`;
      const price = AMOUNT_TRY.toFixed(2);

      const result = await iyzipayCreate(
        (iyzi, req, cb) => iyzi.checkoutFormInitialize.create(req, cb),
        {
          locale: Iyzipay.LOCALE.TR,
          conversationId,
          price,
          paidPrice: price,
          currency: Iyzipay.CURRENCY.TRY,
          basketId: conversationId,
          paymentGroup: Iyzipay.PAYMENT_GROUP.SUBSCRIPTION,
          callbackUrl,
          enabledInstallments: ["1"],
          buyer: {
            id: uid.substring(0, 32),
            name: firstName,
            surname: lastName,
            gsmNumber: process.env.IYZICO_DEFAULT_GSM || "+905350000000",
            email,
            identityNumber: process.env.IYZICO_DEFAULT_IDENTITY || "11111111111",
            lastLoginDate: "2024-01-01 12:00:00",
            registrationDate: "2024-01-01 12:00:00",
            registrationAddress: "Istanbul, Turkiye",
            ip: request.rawRequest?.ip || "85.34.78.112",
            city: "Istanbul",
            country: "Turkey",
            zipCode: "34000",
          },
          shippingAddress: {
            contactName: `${firstName} ${lastName}`,
            city: "Istanbul",
            country: "Turkey",
            address: "Istanbul, Turkiye",
            zipCode: "34000",
          },
          billingAddress: {
            contactName: `${firstName} ${lastName}`,
            city: "Istanbul",
            country: "Turkey",
            address: "Istanbul, Turkiye",
            zipCode: "34000",
          },
          basketItems: [
            {
              id: "PREMIUM_AI",
              name: "Memolandum Premium AI Ceviri",
              category1: "Digital",
              itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
              price,
            },
          ],
        }
      );

      if (result.status !== "success") {
        console.error("iyzico init:", result);
        throw new HttpsError("internal", result.errorMessage || "iyzico başlatılamadı.");
      }

      await db().collection("premiumCheckouts").doc(result.token).set({
        uid,
        provider: "iyzico",
        conversationId,
        createdAt: FieldValue.serverTimestamp(),
      });

      return {
        provider: "iyzico",
        paymentPageUrl: result.paymentPageUrl,
        token: result.token,
      };
    }

    if (provider === "stripe") {
      const secret = process.env.STRIPE_SECRET_KEY;
      if (!secret) {
        throw new HttpsError("failed-precondition", "Stripe yapılandırılmadı (STRIPE_SECRET_KEY).");
      }
      const priceId = process.env.STRIPE_PRICE_ID_PREMIUM;
      const successUrl =
        process.env.STRIPE_SUCCESS_URL || `${SITE_URL}/profile/?premium=success`;
      const cancelUrl = process.env.STRIPE_CANCEL_URL || `${SITE_URL}/?premium=cancel`;

      const params = new URLSearchParams();
      params.set("success_url", `${successUrl}&session_id={CHECKOUT_SESSION_ID}`);
      params.set("cancel_url", cancelUrl);
      params.set("client_reference_id", uid);
      params.set("customer_email", email);
      params.set("metadata[firebaseUid]", uid);
      params.set("locale", "auto");

      if (priceId) {
        params.set("mode", "subscription");
        params.set("line_items[0][price]", priceId);
        params.set("line_items[0][quantity]", "1");
      } else {
        params.set("mode", "payment");
        params.set("line_items[0][price_data][currency]", "usd");
        params.set("line_items[0][price_data][unit_amount]", "299");
        params.set(
          "line_items[0][price_data][product_data][name]",
          "Memolandum Premium — AI Translation"
        );
        params.set("line_items[0][quantity]", "1");
      }

      const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });
      const session = await stripeRes.json();
      if (!session.url) {
        console.error("Stripe:", session);
        throw new HttpsError("internal", session.error?.message || "Stripe oturumu açılamadı.");
      }

      await db().collection("premiumCheckouts").doc(session.id).set({
        uid,
        provider: "stripe",
        createdAt: FieldValue.serverTimestamp(),
      });

      return { provider: "stripe", checkoutUrl: session.url, sessionId: session.id };
    }

    throw new HttpsError("invalid-argument", "provider: shopier | stripe | iyzico");
  }
);

/**
 * Shopier REST webhook — order.created
 * Panel/API'de URL: .../shopierPremiumWebhook
 */
exports.shopierPremiumWebhook = onRequest(
  {
    region: "us-central1",
    secrets: [shopierPat, shopierWebhookToken],
  },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        res.status(405).send("method not allowed");
        return;
      }

      const token = getWebhookToken();
      if (!token) {
        console.error("shopierPremiumWebhook: SHOPIER_WEBHOOK_TOKEN yok");
        res.status(500).send("misconfigured");
        return;
      }

      const rawBody = req.rawBody
        ? Buffer.isBuffer(req.rawBody)
          ? req.rawBody.toString("utf8")
          : String(req.rawBody)
        : typeof req.body === "string"
          ? req.body
          : JSON.stringify(req.body || {});

      const event = verifyAndParseWebhook({
        webhookToken: token,
        body: rawBody,
        headers: req.headers,
      });

      if (event.type !== "order.created") {
        res.status(200).json({ ok: true, ignored: event.type });
        return;
      }

      const order = event.data || {};
      if (order.paymentStatus && order.paymentStatus !== "paid") {
        res.status(200).json({ ok: true, skipped: "unpaid" });
        return;
      }

      const resolved = await resolveUidFromShopierOrder(order);
      if (!resolved?.uid) {
        console.warn("shopierPremiumWebhook: uid eşleşmedi", {
          orderId: order.id,
          email: order?.billingInfo?.email,
        });
        res.status(200).json({ ok: true, unmatched: true });
        return;
      }

      const already = await db()
        .collection("premiumCheckouts")
        .where("shopierOrderId", "==", String(order.id))
        .where("status", "==", "paid")
        .limit(1)
        .get();
      if (!already.empty) {
        res.status(200).json({ ok: true, duplicate: true });
        return;
      }

      await activatePremium(resolved.uid, {
        provider: "shopier",
        externalId: String(order.id),
        amount: Number(order?.totals?.total) || AMOUNT_TRY,
        currency: order.currency || "TRY",
      });

      const checkoutId = resolved.checkoutId || `shopier_${order.id}`;
      await db()
        .collection("premiumCheckouts")
        .doc(checkoutId)
        .set(
          {
            uid: resolved.uid,
            provider: "shopier",
            status: "paid",
            shopierOrderId: String(order.id),
            matchVia: resolved.via,
            completedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

      // Ephemeral ürünleri temizle (sabit ürün hariç)
      const pat = getPat();
      if (pat && order.lineItems?.length) {
        const client = new ShopierApiClient({ pat });
        for (const li of order.lineItems) {
          const pid = String(li.productId || "");
          if (pid && pid !== String(DEFAULT_PRODUCT_ID)) {
            try {
              await client.products.delete(pid);
            } catch (e) {
              console.warn("shopier product cleanup:", pid, e?.message || e);
            }
          }
        }
      }

      // Dijital siparişi fulfilled işaretle
      if (pat && order.id) {
        try {
          const client = new ShopierApiClient({ pat });
          await client.orders.fulfill(order.id, {
            productType: "digital",
            note: "Memolandum Premium activated",
          });
        } catch (e) {
          console.warn("shopier fulfill:", e?.message || e);
        }
      }

      res.status(200).json({ ok: true, uid: resolved.uid });
    } catch (e) {
      console.error("shopierPremiumWebhook:", e?.message || e);
      res.status(400).send("invalid webhook");
    }
  }
);

/** Klasik OSB callback (API key/secret varsa) */
exports.shopierPremiumCallback = onRequest({ region: "us-central1" }, async (req, res) => {
  try {
    const body = { ...(req.query || {}), ...(req.body || {}) };
    const creds = getShopierOsbCredentials();
    if (!creds) {
      res.redirect(302, `${SITE_URL}/?premium=error`);
      return;
    }

    if (!verifyShopierOsbCallback(body, creds.apiSecret)) {
      res.redirect(302, `${SITE_URL}/?premium=failed`);
      return;
    }

    const status = String(body.status || "").toLowerCase();
    const orderId = String(body.platform_order_id || "");
    if (status !== "success" || !orderId) {
      res.redirect(302, `${SITE_URL}/?premium=failed`);
      return;
    }

    const checkoutRef = db().collection("premiumCheckouts").doc(orderId);
    const checkoutSnap = await checkoutRef.get();
    let uid = checkoutSnap.exists ? checkoutSnap.data().uid : null;
    if (!uid) {
      const m = /^mm_([^_]+)_/.exec(orderId);
      uid = m?.[1] || null;
    }
    if (!uid) {
      res.redirect(302, `${SITE_URL}/?premium=failed`);
      return;
    }

    if (checkoutSnap.exists && checkoutSnap.data().status === "paid") {
      res.redirect(302, `${SITE_URL}/profile/?premium=success`);
      return;
    }

    await activatePremium(uid, {
      provider: "shopier",
      externalId: String(body.payment_id || orderId),
      amount: AMOUNT_TRY,
      currency: "TRY",
    });

    await checkoutRef.set(
      {
        completedAt: FieldValue.serverTimestamp(),
        status: "paid",
        paymentId: body.payment_id || null,
      },
      { merge: true }
    );

    res.redirect(302, `${SITE_URL}/profile/?premium=success`);
  } catch (e) {
    console.error("shopierPremiumCallback:", e);
    res.redirect(302, `${SITE_URL}/?premium=error`);
  }
});

exports.iyzicoPremiumCallback = onRequest({ region: "us-central1" }, async (req, res) => {
  try {
    const token = req.body?.token || req.query?.token;
    if (!token) {
      res.status(400).send("token missing");
      return;
    }

    const result = await iyzipayCreate(
      (iyzi, request, cb) => iyzi.checkoutForm.retrieve(request, cb),
      { locale: Iyzipay.LOCALE.TR, token }
    );

    if (result.status !== "success" || result.paymentStatus !== "SUCCESS") {
      res.redirect(302, `${SITE_URL}/?premium=failed`);
      return;
    }

    const checkoutSnap = await db().collection("premiumCheckouts").doc(token).get();
    let uid = checkoutSnap.exists ? checkoutSnap.data().uid : null;
    if (!uid && result.conversationId) {
      const m = /^mm_([^_]+)_/.exec(result.conversationId);
      uid = m?.[1] || null;
    }
    if (!uid) {
      res.redirect(302, `${SITE_URL}/?premium=failed`);
      return;
    }

    await activatePremium(uid, {
      provider: "iyzico",
      externalId: String(result.paymentId || token),
      amount: AMOUNT_TRY,
      currency: "TRY",
    });

    await db().collection("premiumCheckouts").doc(token).set(
      { completedAt: FieldValue.serverTimestamp(), status: "paid" },
      { merge: true }
    );

    res.redirect(302, `${SITE_URL}/profile/?premium=success`);
  } catch (e) {
    console.error("iyzicoPremiumCallback:", e);
    res.redirect(302, `${SITE_URL}/?premium=error`);
  }
});

exports.stripePremiumWebhook = onRequest({ region: "us-central1" }, async (req, res) => {
  try {
    const event = req.body;
    if (event?.type === "checkout.session.completed") {
      const session = event.data.object;
      const uid = session.client_reference_id || session.metadata?.firebaseUid;
      if (uid) {
        await activatePremium(uid, {
          provider: "stripe",
          externalId: session.id,
          amount: (session.amount_total || 299) / 100,
          currency: (session.currency || "usd").toUpperCase(),
        });
      }
    }
    res.json({ received: true });
  } catch (e) {
    console.error("stripePremiumWebhook:", e);
    res.status(500).send("error");
  }
});

exports.activatePremium = activatePremium;
