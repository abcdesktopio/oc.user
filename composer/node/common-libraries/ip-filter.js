/*
* Software Name : abcdesktop.io
* Version: 0.2
* SPDX-FileCopyrightText: Copyright (c) 2020-2021 Orange
* SPDX-License-Identifier: GPL-2.0-only
*
* This software is distributed under the GNU General Public License v2.0 only
* see the "license.txt" file for more details.
*
* Author: abcdesktop.io team
* Software description: cloud native desktop service
*/

const { promises:dnsPromises } = require("dns");

const dico = new Map();

const resolveFQDN = async (addr = '', seekIp = '', useCache = false) => {
    const domains = await dnsPromises.resolveSrv('*.' + addr);
    let ips = [];
    if (useCache) {
        const promises = [];
        for (const domain of domains) {
            if (dico.has(domain.name)) {
                ips.push(dico.get(domain.name));
            } else {
                const pending = dnsPromises.lookup(domain.name)
                                            .then(ip => { dico.set(domain.name, ip); return ip; });
                promises.push(pending);
            }
        }
        ips = ips.concat(await Promise.all(promises));
    } else {
        ips = await Promise.all(domains.map(d => dnsPromises.lookup(d.name)));
    }

    for (const { address } of ips) {
        if (address.includes(seekIp)) {
            return true;
        }
    }

    return false;
};

const search = async (ip, seekIp, useCache = true) => {
    let addresses;

    if (useCache) {
        if (!dico.has(ip)) {
            dico.set(ip, await dnsPromises.reverse(ip));
        }
        addresses = dico.get(ip);
    } else {
        addresses = await dnsPromises.reverse(ip);
    }

    const promises = [];
    for (const addr of addresses) {
        promises.push(resolveFQDN(addr, seekIp, useCache));
    }

    const results = await Promise.all(promises);
    return results.includes(true);
};

const searchbyname = async ( ip, useCache = true ) => {
    // do reverse to the removeip 10-244-2-51.nginx.abcdesktop.svc.cluster.local
    // get nginx.abcdesktop.svc.cluster.local
    // run nslookup nginx.abcdesktop.svc.cluster.local
    // Server:              10.96.0.10
    // Address:     10.96.0.10#53
    //
    // Name:        nginx.abcdesktop.svc.cluster.local
    // Address: 10.244.2.51
    // Name:        nginx.abcdesktop.svc.cluster.local
    // Address: 10.244.3.39
    // Name:        nginx.abcdesktop.svc.cluster.local
    // Address: 10.244.4.58
    //
    // Check if remoteip is in Address
  
    let addresses;

    if (useCache) {
        if (!dico.has(ip)) {
            dico.set(ip, await dnsPromises.reverse(ip));
        }
        addresses = dico.get(ip);
    } else {
        addresses = await dnsPromises.reverse(ip);
    }
    
    if (addresses && addresses.length < 1)
        return false;

    const fqdn = addresses[0];
    // remote the hostname from the fqdn
    const hostname_index = fqdn.indexOf('.') + 1;
    if ( hostname_index == 0 )
        return false;
    
    const service_fqdn = fqdn.substr(hostname_index);
    const services = await dnsPromises.resolve(service_fqdn);
    return services.includes( ip );
};


module.exports = {
    search,
    searchbyname
};
