/**
 * level5Config.js — Configuration for Level 5: Final Quest & Emotional Ending.
 * 
 * All memories, friend messages, photo paths, and ending parameters live here.
 * Easily customizable for names, photos, messages, and order.
 */

export const LEVEL5_CONFIG = {
    title: 'THE FINAL QUEST',
    location: 'MSRIT CAMPUS — WARM EVENING',

    // Transition text shown at the beginning of Level 5
    transitionHeader: 'ALL WORLDS COMPLETE.',
    transitionSub: 'YOU MADE IT.',

    // Status readout lines shown after friends gather
    statusReadout: {
        missions: 'ALL MISSIONS COMPLETE',
        memories: 'MEMORIES RECOVERED: 100%',
        friendship: 'FRIENDSHIP LEVEL: MAX',
    },

    // Final quest prompt before the reveal
    finalQuestPrompt: 'FINAL QUEST: LOOK BEHIND YOU.',

    // Birthday reveal banner
    birthdayRevealTitle: '🎂 HAPPY BIRTHDAY ADITYA ❤️',
    birthdayRevealSub: 'All your friends are here celebrating with you!',

    // Memory callbacks spoken by friends as they arrive in campus
    memoryCallbacks: [
        {
            who: 'anisha',
            text: 'Remember those endless talks near ESB and cold Diet Cokes? 🌯🥤',
        },
        {
            who: 'diya',
            text: 'And the late evening metro rides with pink headphones playing our favorite tracks on loop... 🎧🎶',
        },
        {
            who: 'lord',
            text: 'Hardcore gym sessions and debugging code until 3 AM! 🏋️‍♂️💻',
        },
        {
            who: 'chirantan',
            text: 'Massaging tired shoulders and eating yummy SK rolls 🍗🔥',
        },
        {
            who: 'amogh',
            text: 'Even if I bully you, I still love you macha 😭❤️',
        },
    ],

    // Photos from public/montage with friend messages
    montagePhotos: [
        {
            src: '/montage/candid.jpg',
            caption: 'The gang together. Where it all began.',
            author: 'Anisha & Squad',
        },
        {
            src: '/montage/IMG_1237.JPG',
            caption: 'Unfiltered laughter and iconic moments.',
            author: 'Diya',
        },
        {
            src: '/montage/IMG_1239.JPG',
            caption: 'Campus memories that live forever.',
            author: 'Lord',
        },
        {
            src: '/montage/IMG_1258.JPG',
            caption: 'Late night vibes & endless conversations.',
            author: 'Chirantan',
        },
        {
            src: '/montage/IMG_1262.JPG',
            caption: 'Always down for the next adventure.',
            author: 'Amogh',
        },
        {
            src: '/montage/IMG_1287.JPG',
            caption: 'Good food, great music, best friends.',
            author: 'Build Crew',
        },
        {
            src: '/montage/IMG_2943.jpeg',
            caption: 'Another memory unlocked!',
            author: 'Anisha',
        },
        {
            src: '/montage/IMG_2978.jpg',
            caption: 'Through every level, we survived together.',
            author: 'Diya',
        },
        {
            src: '/montage/IMG_3916.jpg',
            caption: 'Making every single day count.',
            author: 'Lord',
        },
        {
            src: '/montage/IMG_3918.jpg',
            caption: 'Pure chaos and maximum friendship.',
            author: 'Chirantan',
        },
        {
            src: '/montage/IMG_4237.jpg',
            caption: 'Standing strong through all challenges.',
            author: 'Amogh',
        },
        {
            src: '/montage/IMG_4263.jpg',
            caption: 'Smiles that make the journey worth it.',
            author: 'Anisha',
        },
        {
            src: '/montage/IMG_4315.jpg',
            caption: 'Keeping the energy at 100%.',
            author: 'Diya',
        },
        {
            src: '/montage/IMG_4356.jpg',
            caption: 'Moments that will never fade.',
            author: 'Lord',
        },
        {
            src: '/montage/IMG_4415.jpg',
            caption: 'Leveling up together year after year.',
            author: 'Chirantan',
        },
        {
            src: '/montage/IMG_4586.jpg',
            caption: 'Unbreakable bond.',
            author: 'Amogh',
        },
        {
            src: '/montage/IMG_4588.jpg',
            caption: 'To many more core memories ahead!',
            author: 'Build Crew',
        },
        {
            src: '/montage/IMG_4589.jpg',
            caption: 'Cheers to the best engineer & friend!',
            author: 'Anisha',
        },
        {
            src: '/montage/IMG_4920.jpg',
            caption: 'Legendary times.',
            author: 'Diya',
        },
        {
            src: '/montage/IMG_7754.JPG',
            caption: 'Forever part of the crew.',
            author: 'Lord',
        },
        {
            src: '/montage/b14e22dc-569f-4bcf-bce9-6d73bb65ca58.jpg',
            caption: 'Captured forever.',
            author: 'Chirantan',
        },
        {
            src: '/montage/d8.jpeg',
            caption: 'One for the history books.',
            author: 'Amogh',
        },
        {
            src: '/montage/EXVS4639.JPG',
            caption: 'Living our best life.',
            author: 'Build Crew',
        },
    ],

    // Final group photo card
    groupPhoto: {
        src: '/montage/IMG_4315.jpg',
        title: 'THE FINAL GROUP PHOTO',
        lines: [
            'THANKS FOR PLAYING.',
            'AND THANKS FOR BEING OUR FRIEND.',
        ],
    },

    // Final summary screen readout
    finalScreen: {
        title: 'HAPPY BIRTHDAY ADITYA ❤️',
        memories: 'MEMORIES RECOVERED: 100%',
        friendship: 'FRIENDSHIP LEVEL: MAX',
        bossJoke: 'FINAL BOSS: ADULTHOOD.',
        status: 'GAME COMPLETE.',
    },
}

export default LEVEL5_CONFIG
