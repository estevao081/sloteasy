import { Github, Globe, Linkedin, MessageCircle } from "lucide-react";

const socialLinks = [
  { title: "LinkedIn", url: "https://www.linkedin.com/in/estevaodev/", icon: Linkedin },
  { title: "GitHub", url: "https://github.com/estevao081", icon: Github },
  { title: "Portfólio", url: "https://estvdev.netlify.app/", icon: Globe },
] as const;

// Rodapé fixo na tela (posição fixa), presente em todas as páginas do
// sistema — inclusive na tela de login, que não usa o AppShell. Não
// aparece na impressão (ver .no-print).
export function AppFooter() {
  return (
    <footer className="no-print app-footer">
      <div className="app-footer-line">Powered by EstvDev</div>
      <div className="app-footer-social">
        {socialLinks.map((s) => (
          <a
            key={s.title}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="app-footer-link"
          >
            <s.icon className="h-4 w-4" />
            <span>{s.title}</span>
          </a>
        ))}
      </div>
    </footer>
  );
}
