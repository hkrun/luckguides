export interface Home {
    hero: {
        title: string;
        subtitle: string;
        cta: string;
        badges: string[];
    };
    palm: {
        sectionTitle: string;
        sectionDesc: string;
        elements: {
            fire: string;
            water: string;
            wood: string;
            metal: string;
            earth: string;
        };
        upload: {
            title: string;
            tips: string;
            placeholder: string;
            shot: string;
            upload: string;
            reshot: string;
            reupload: string;
            start: string;
            disabled: string;
            analyzing: string;
            viewResult: string;
            cancel: string;
            captureAndUse: string;
            cameraError: string;
            noImageError: string;
            modelError: string;
            analysisError: string;
        };
        progress: {
            reading: string;
            parsing: string;
            generating: string;
            done: string;
        };
    result: {
        title: string;
        desc: string;
        distTitle: string;
        lackTitle: string;
        insightTitle: string;
        adviceTitle: string;
        career: string;
        wealth: string;
        health: string;
        defaultAdvice: string;
        defaultCareer: string;
        defaultWealth: string;
        defaultHealth: string;
        reset: string;
        shop: string;
        guide: string;
    };
    };
    painPoints: {
        title: string;
        solutionLabel: string;
        items: Array<{
            title: string;
            desc: string;
            solution: string;
        }>;
    };
    services: {
        title: string;
        calc: {
            title: string;
            point: string;
            cta: string;
        };
        bracelet: {
            title: string;
            talismanTitle: string;
            talismanDesc: string;
            table: {
                lack: string;
                material: string;
                meaning: string;
            };
            tableRows: Array<{
                lack: string;
                material: string;
                meaning: string;
            }>;
        };
        valueAdded: {
            title: string;
            items: string[];
            descriptions: string[];
        };
    };
    advantages: {
        title: string;
        items: Array<{
            title: string;
            description: string;
        }>;
    };
    action: {
        title: string;
        benefitTitle: string;
        benefitDesc: string;
        reviewsTitle: string;
        reviews: Array<{
            quote: string;
            name: string;
        }>;
        ctaMeasure: string;
        ctaPlan: string;
        ctaPay: string;
        rightTitle: string;
        rightDesc: string;
    };
    modal: {
        title: string;
        recommendationDesc: string;
        month: string;
        others: string;
        advice: string;
        wearingAdvice: string;
        close: string;
        buy: string;
    };
}
