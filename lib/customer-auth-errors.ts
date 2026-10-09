export function customerAuthError(
  error: { code?: string; status?: number },
  registering: boolean,
) {
  if (error.status === 429)
    return {
      status: 429,
      message: "Muitas tentativas. Aguarde alguns minutos.",
    };
  if (
    [
      "phone_provider_disabled",
      "signup_disabled",
      "sms_send_failed",
      "phone_not_confirmed",
    ].includes(error.code || "")
  )
    return {
      status: 503,
      message:
        "O acesso por telefone ainda não está disponível. Você pode continuar comprando sem entrar. Fale com a Villa Natura se precisar de ajuda.",
    };
  if (error.code === "weak_password")
    return {
      status: 400,
      message:
        "Escolha uma senha mais forte, com pelo menos 8 caracteres, letras e números.",
    };
  return {
    status: registering ? 400 : 401,
    message: registering
      ? "Não foi possível criar sua conta. Confira os dados ou use Entrar se já tem cadastro."
      : "Telefone ou senha incorretos.",
  };
}
