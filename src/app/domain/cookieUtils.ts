/**
 * Created by stefanos on 2/3/2017.
 */

export function getCookie(name: string) : string {
    const ca: string[] = document.cookie.split(';');
    const caLen: number = ca.length;
    const cookieName = `${name}=`;
    let c: string;
    /*console.log(`document.cookie is: ${document.cookie.toString()}`);*/
    /*console.log(`ca is: ${JSON.stringify(ca)}`);*/
    for (let i = 0; i < caLen; i += 1) {
        c = ca[i].replace(/^\s+/g, '');
        if (c.indexOf(cookieName) === 0) {
            return c.substring(cookieName.length, c.length);
        }
    }

    return null;
}

export function deleteCookie(name) {
    setCookie(name, '', -1);
    console.log(`after delete: document.cookie is: ${document.cookie.toString()}`);
}

function setCookie(name: string, value: string, expireDays: number, path: string = '') {
    const d: Date = new Date();
    d.setTime(d.getTime() + expireDays * 24 * 60 * 60 * 1000);
    const expires: string = `expires=${d.toUTCString()}`;
    const cpath: string = path ? `; path=${path}` : '';
    document.cookie = `${name}=${value}; ${expires}${cpath}`;
}
