export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export const faqItems: FAQItem[] = [
  {
    id: 'faq-content',
    question: 'Do I need to provide content?',
    answer:
      'We\'ll write all the copy for your website based on our onboarding questionnaire. You just answer some questions about your business and we handle the rest.',
  },
  {
    id: 'faq-existing-site',
    question: 'What if I already have a website?',
    answer:
      'We\'ll build you a new one from scratch on modern technology. If you have content or images from your current site you\'d like to keep, we\'ll migrate them.',
  },
  {
    id: 'faq-changes',
    question: 'Can I make changes after launch?',
    answer:
      'Yes. All managed tiers include ongoing updates and revisions. You can request changes anytime via email or your check-in calls.',
  },
  {
    id: 'faq-cancel',
    question: 'What happens if I want to cancel?',
    answer:
      'After your minimum 6-month contract, you can cancel with 30 days\' notice. You\'ll keep your domain name. We can export your site data if you want to move to another provider.',
  },
  {
    id: 'faq-ownership',
    question: 'Do I own my website?',
    answer:
      'You own all the content. The website is hosted and maintained by us as part of your plan. If you leave, we provide a full export of your data and content.',
  },
  {
    id: 'faq-technical',
    question: 'I\'m not technical — will I understand what\'s going on?',
    answer:
      'Absolutely. We explain everything in plain English. You\'ll never hear us use jargon without explaining it. That\'s a promise.',
  },
];
