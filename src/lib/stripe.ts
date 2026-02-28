/**
 * Lógica de Stripe (Placeholder)
 * En producción, esto llamaría a una Edge Function de Supabase para crear un Checkout Session.
 */
export const createPaymentIntent = async (amount: number) => {
  console.log(`Simulando pago de ${amount}€...`);
  // Simulación de retraso de red
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { success: true, transactionId: `fake_tr_${Math.random().toString(36).substr(2, 9)}` };
};