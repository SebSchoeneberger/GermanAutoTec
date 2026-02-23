import IconTelegram from '../assets/SocialMedia/telegram-svgrepo-com.svg'
import { TELEGRAM_URL } from '../constants/contact'

export default function TelegramFAB() {
  return (
    <a
      href={TELEGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="telegram-fab fixed z-[60] md:hidden flex items-center justify-center w-14 h-14 rounded-full bg-[#0088cc] text-white shadow-lg hover:bg-[#0077b5] hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-[#0088cc] focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#0a0a0b]"
      aria-label="Message us on Telegram"
    >
      <img src={IconTelegram} alt="" className="w-8 h-8" aria-hidden />
    </a>
  )
}
