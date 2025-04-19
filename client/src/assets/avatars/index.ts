// Base64 编码函数，支持 Unicode 字符
export function utf8ToBase64(str: string): string {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
    return String.fromCharCode(parseInt(p1, 16));
  }));
}

// Base64 解码函数，支持 Unicode 字符
export function base64ToUtf8(str: string): string {
  return decodeURIComponent(Array.prototype.map.call(atob(str), (c) => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

export const avatarIcons = [
  {
    id: 'male-1',
    name: '男性角色 1',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="35" r="20" fill="#4F46E5" /><path d="M50,55 C33,55 20,68 20,85 L80,85 C80,68 67,55 50,55 Z" fill="#4F46E5" /></svg>`,
  },
  {
    id: 'female-1',
    name: '女性角色 1',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="35" r="20" fill="#EC4899" /><path d="M32,90 L50,55 L68,90" stroke="#EC4899" stroke-width="10" stroke-linecap="round" fill="none" /><path d="M32,70 L68,70" stroke="#EC4899" stroke-width="10" stroke-linecap="round" /></svg>`,
  },
  {
    id: 'hero',
    name: '英雄角色',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,20 61,44 87,47 68,66 73,90 50,78 27,90 32,66 13,47 39,44" fill="#EAB308" /></svg>`,
  },
  {
    id: 'villain',
    name: '反派角色',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="#DC2626" /><polygon points="50,20 30,80 70,80" fill="#DC2626" /><polygon points="20,50 80,50 50,80" fill="#DC2626" /></svg>`,
  },
  {
    id: 'elder',
    name: '长者角色',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="40" r="20" fill="#65a30d" /><path d="M30,85 Q50,65 70,85" stroke="#65a30d" stroke-width="10" fill="none" /><path d="M37,35 Q50,50 63,35" stroke="white" stroke-width="3" fill="none" /></svg>`,
  },
  {
    id: 'child',
    name: '儿童角色',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="40" r="18" fill="#0EA5E9" /><path d="M35,60 L65,60 L65,85 L35,85 Z" fill="#0EA5E9" /><circle cx="40" cy="38" r="4" fill="white" /><circle cx="60" cy="38" r="4" fill="white" /></svg>`,
  },
  {
    id: 'warrior',
    name: '战士角色',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,20 L70,40 L60,80 L40,80 L30,40 Z" fill="#6D28D9" /><path d="M40,50 L60,50" stroke="white" stroke-width="4" /><path d="M45,40 L55,40" stroke="white" stroke-width="4" /></svg>`,
  },
  {
    id: 'magic',
    name: '魔法角色',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="40" r="20" fill="#2563EB" /><path d="M30,60 L70,60 L60,90 L40,90 Z" fill="#2563EB" /><path d="M30,30 L20,20 M70,30 L80,20 M30,50 L20,60 M70,50 L80,60 M50,20 L50,10" stroke="#2563EB" stroke-width="3" /></svg>`,
  },
];

export const generateColoredAvatar = (text: string): string => {
  // 从文本生成颜色
  const hash = text.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const hue = Math.abs(hash % 360);
  const color = `hsl(${hue}, 65%, 55%)`;
  const darkerColor = `hsl(${hue}, 65%, 45%)`;
  
  // 生成SVG
  const initials = text.substring(0, 2).toUpperCase();
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="50" fill="${color}" />
    <text x="50" y="62" font-family="Arial" font-size="35" fill="white" text-anchor="middle">${initials}</text>
  </svg>`;
};