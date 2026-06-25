import { useCallback, useEffect, useRef } from "react";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: {
    name?: string;
    contact?: string;
    email?: string;
  };
  theme?: {
    color?: string;
  };
  config?: {
    display?: {
      blocks?: Record<string, { name: string; instruments: { method: string; flows?: string[] }[] }>;
      sequence?: string[];
      preferences?: { show_default_blocks?: boolean };
    };
  };
  handler?: (response: RazorpayPaymentResponse) => void;
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    animation?: boolean;
  };
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: string, callback: (response: { error: { description: string } }) => void): void;
}

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay script"));
    document.body.appendChild(script);
  });
}

export function useRazorpay() {
  const scriptLoaded = useRef(false);

  useEffect(() => {
    loadScript(RAZORPAY_SCRIPT)
      .then(() => { scriptLoaded.current = true; })
      .catch(console.error);
  }, []);

  const openRazorpay = useCallback(
    (options: RazorpayOptions): Promise<RazorpayPaymentResponse> => {
      return new Promise(async (resolve, reject) => {
        // Ensure script is loaded
        if (!scriptLoaded.current || !window.Razorpay) {
          try {
            await loadScript(RAZORPAY_SCRIPT);
            scriptLoaded.current = true;
          } catch {
            reject(new Error("Razorpay could not be loaded. Check your connection."));
            return;
          }
        }

        const rzp = new window.Razorpay({
          ...options,
          handler: (response) => resolve(response),
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled by user")),
            escape: true,
            animation: true,
          },
        });

        rzp.on("payment.failed", (response) => {
          reject(new Error(response?.error?.description ?? "Payment failed"));
        });

        rzp.open();
      });
    },
    []
  );

  return { openRazorpay };
}
