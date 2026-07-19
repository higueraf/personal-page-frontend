export interface ResetPasswordDto {
  token: string;
  password: string;
  password_confirm: string;
}
