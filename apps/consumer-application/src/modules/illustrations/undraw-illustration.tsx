import chattingSvg from '#/assets/illustrations/undraw-chatting.svg?raw';
import composeMusicSvg from '#/assets/illustrations/undraw-compose-music.svg?raw';
import formsSvg from '#/assets/illustrations/undraw-forms.svg?raw';
import lookingForAnswersSvg from '#/assets/illustrations/undraw-looking-for-answers.svg?raw';
import upgradeSvg from '#/assets/illustrations/undraw-upgrade.svg?raw';

const ILLUSTRATIONS = {
  chatting: chattingSvg,
  composeMusic: composeMusicSvg,
  forms: formsSvg,
  lookingForAnswers: lookingForAnswersSvg,
  upgrade: upgradeSvg,
} as const;

type UndrawName = keyof typeof ILLUSTRATIONS;

function UndrawIllustration({ className, name }: { className?: string; name: UndrawName }) {
  return (
    <span
      aria-hidden="true"
      className={['block text-primary [&_svg]:block', className].filter(Boolean).join(' ')}
      dangerouslySetInnerHTML={{ __html: ILLUSTRATIONS[name] }}
    />
  );
}

export { UndrawIllustration };
export type { UndrawName };
