/**
 * AUTO-GENERATED — DO NOT EDIT.
 *
 * Généré depuis le contrat OpenAPI de club-manager-api via
 * `npm run api:generate`. Toute modification manuelle sera perdue à la
 * prochaine génération. Voir docs/API_CLIENT.md.
 */
export interface paths {
    "/v1/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Utilisateur courant */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** Format: uuid */
                            id: string;
                            email: string | null;
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Clubs dont l'utilisateur est membre */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            clubs: components["schemas"]["ClubDto"][];
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Détail du club */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ClubDto"];
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/capabilities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Capacités du club (FBI facultatif) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ClubCapabilities"];
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/teams": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Équipes du club */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            teams: components["schemas"]["TeamDto"][];
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/matches": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Matchs du club */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            matches: components["schemas"]["MatchListItemDto"][];
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/matches/{matchId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                    matchId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Détail du match */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MatchDetailsDto"];
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/matches/{matchId}/documents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                    matchId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Documents e-Marque du match */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            documents: components["schemas"]["MatchDocumentDto"][];
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/integrations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Statut des intégrations */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["IntegrationStatusDto"];
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/integrations/fbi": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["SaveFbiCredentialsDto"];
                };
            };
            responses: {
                /** @description Identifiants enregistrés */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            saved: boolean;
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/integrations/fbi/test": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Résultat du test (HttpFbiClient) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            success: boolean;
                            message: string;
                        };
                    };
                };
                /** @description Job navigateur empilé en secours */
                202: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: false;
                            message: string;
                            /** Format: uuid */
                            jobId: string;
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/sync-runs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Historique des synchronisations */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            syncRuns: components["schemas"]["SyncRunDto"][];
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/integrations/ffbb/sync": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Résultat de la synchronisation */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** Format: uuid */
                            syncRunId: string;
                            status: string;
                            stats: {
                                [key: string]: number;
                            };
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/issues": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Anomalies e-Marque à vérifier */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            issues: components["schemas"]["IssueDto"][];
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/clubs/{clubId}/issues/{matchId}/resolve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description UUID ou slug du club */
                    clubId: string;
                    matchId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Anomalie résolue */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            resolved: true;
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/jobs/{jobId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    jobId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Statut du job */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["JobStatusDto"];
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/platform/clubs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Clubs de la plateforme (platform_admin) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            clubs: components["schemas"]["PlatformClubDto"][];
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["CreateClubDto"];
                };
            };
            responses: {
                /** @description Club créé */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** Format: uuid */
                            clubId: string;
                            slug: string;
                            adminInviteError: string | null;
                        };
                    };
                };
                /** @description Non authentifié */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Accès refusé */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                /** @description Introuvable */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description État du service */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {string} */
                            status: "ok";
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        ErrorEnvelope: {
            error: {
                code: string;
                message: string;
            };
        };
        ClubDto: {
            /** Format: uuid */
            id: string;
            slug: string;
            name: string;
            shortName: string | null;
            logoUrl: string | null;
            accentColor: string | null;
            timezone: string;
            /** @enum {string} */
            status: "active" | "suspended";
            roles: components["schemas"]["ClubRole"][];
        };
        /** @enum {string} */
        ClubRole: "club_admin" | "correspondant_club" | "responsable_tables" | "coach" | "joueur" | "parent";
        ClubCapabilities: {
            ffbb: boolean;
            fbi: boolean;
            emarque: boolean;
        };
        TeamDto: {
            /** Format: uuid */
            id: string;
            name: string;
            category: string | null;
            active: boolean;
        };
        MatchListItemDto: {
            /** Format: uuid */
            id: string;
            numero: string | null;
            journee: string | null;
            matchDatetime: string | null;
            isHome: boolean | null;
            teamName: string | null;
            opponentName: string | null;
            venueLabel: string | null;
            scoreHome: number | null;
            scoreAway: number | null;
            /** @enum {string} */
            status: "scheduled" | "played" | "postponed" | "cancelled" | "forfeit";
            emarqueStatus: string;
        };
        MatchDetailsDto: {
            /** Format: uuid */
            id: string;
            numero: string | null;
            journee: string | null;
            matchDatetime: string | null;
            isHome: boolean | null;
            teamName: string | null;
            opponentName: string | null;
            venueLabel: string | null;
            scoreHome: number | null;
            scoreAway: number | null;
            /** @enum {string} */
            status: "scheduled" | "played" | "postponed" | "cancelled" | "forfeit";
            emarque: components["schemas"]["EmarqueSummaryDto"];
            participants: components["schemas"]["MatchParticipantDto"][];
            coaches: components["schemas"]["MatchCoachDto"][];
            officials: components["schemas"]["MatchOfficialDto"][];
            tableOfficials: components["schemas"]["MatchOfficialDto"][];
            stats: components["schemas"]["PlayerMatchStatsDto"][];
        };
        EmarqueSummaryDto: {
            status: string;
            source: string | null;
            lastRetrievedAt: string | null;
            qualityWarningCount: number | null;
        };
        MatchParticipantDto: {
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            teamSide: "home" | "away";
            jerseyNumber: string | null;
            firstName: string | null;
            lastName: string | null;
            isCaptain: boolean;
            isStarter: boolean | null;
            /** Format: uuid */
            licencieId: string | null;
        };
        MatchCoachDto: {
            /** @enum {string} */
            teamSide: "home" | "away";
            /** @enum {string} */
            role: "principal" | "adjoint";
            firstName: string | null;
            lastName: string | null;
            /** Format: uuid */
            licencieId: string | null;
        };
        MatchOfficialDto: {
            role: string;
            firstName: string | null;
            lastName: string | null;
            /** Format: uuid */
            licencieId: string | null;
        };
        PlayerMatchStatsDto: {
            /** Format: uuid */
            participantId: string;
            /** @enum {string} */
            teamSide: "home" | "away";
            jerseyNumber: string | null;
            firstName: string | null;
            lastName: string | null;
            secondsPlayed: number | null;
            points: number | null;
            threePointsMade: number | null;
            twoPointsInteriorMade: number | null;
            twoPointsExteriorMade: number | null;
            freeThrowsMade: number | null;
            foulsCommitted: number | null;
        };
        MatchDocumentDto: {
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            type: "emarque_zip" | "match_sheet" | "summary" | "shot_chart" | "other";
            filename: string | null;
            /** @enum {string} */
            status: "downloaded" | "parsing" | "imported" | "error";
            downloadedAt: string | null;
            downloadUrl: string | null;
        };
        IntegrationStatusDto: {
            ffbb: {
                enabled: boolean;
                lastSyncAt: string | null;
                lastSyncStatus: string | null;
            };
            fbi: {
                configured: boolean;
                connected: boolean;
                lastLoginAt: string | null;
                autoImportEmarque: boolean;
                lastError: string | null;
            };
        };
        SaveFbiCredentialsDto: {
            username: string;
            password?: string;
        };
        SyncRunDto: {
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            provider: "ffbb" | "fbi";
            /** @enum {string} */
            status: "running" | "success" | "partial" | "error";
            startedAt: string;
            finishedAt: string | null;
            errorLog: string | null;
        };
        IssueDto: {
            /** Format: uuid */
            matchId: string;
            numero: string | null;
            opponentName: string | null;
            matchDatetime: string | null;
            /** @enum {string} */
            emarqueStatus: "error" | "needs_review";
        };
        JobStatusDto: {
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            type: "test_connection" | "discover_emarque";
            /** @enum {string} */
            status: "pending" | "claimed" | "running" | "succeeded" | "failed";
            attemptCount: number;
            lastError: string | null;
            result?: unknown;
            scheduledAt: string;
            finishedAt: string | null;
        };
        PlatformClubDto: {
            /** Format: uuid */
            id: string;
            slug: string;
            name: string;
            ffbbClubId: string;
            /** @enum {string} */
            status: "active" | "suspended";
            ffbb: boolean;
            fbi: boolean;
            emarque: boolean;
        };
        CreateClubDto: {
            name: string;
            ffbbClubId: string;
            slug?: string;
            timezone?: string;
            /** Format: email */
            adminEmail?: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
