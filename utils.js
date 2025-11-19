// Add your Cloudinary details here
export const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/dnia8lb2q/auto/upload`;
export const PRESET = 'EcoBirla_avatars';

export const getTickImg = (type) => {
    const map = { gold: 'https://i.ibb.co/Q2C7MrM/gold.png', silver: 'https://i.ibb.co/gLJLF9Z2/silver.png', blue: 'https://i.ibb.co/kgJpMCHr/blue.png' };
    return type ? `<img src="${map[type]}" class="w-4 h-4 inline ml-1 align-middle">` : '';
};

export const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export const uploadToCloudinary = async (fileBlob) => {
    const fd = new FormData();
    fd.append('file', fileBlob);
    fd.append('upload_preset', PRESET);
    try {
        const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: fd });
        const data = await res.json();
        return data.secure_url;
    } catch (e) { throw e; }
};
