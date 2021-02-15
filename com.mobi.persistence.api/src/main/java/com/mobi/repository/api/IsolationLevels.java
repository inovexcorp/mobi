package com.mobi.repository.api;

/*-
 * #%L
 * com.mobi.persistence.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

public enum IsolationLevels {

    /**
     * None: the lowest isolation level; transactions can see their own changes, but may not be able to roll them back
     * and no support for isolation among transactions is guaranteed
     */
    NONE,

    /**
     * Read Uncommitted: transactions can be rolled back, but not necessarily isolated: concurrent transactions might
     * see each other's uncommitted data (so-called 'dirty reads')
     */
    READ_UNCOMMITTED,

    /**
     * Read Committed: in this isolation level only statements from other transactions that have been committed (at some
     * point) can be seen by this transaction.
     */
    READ_COMMITTED,

    /**
     * Snapshot Read: in addition to {@link #READ_COMMITTED}, query results in this isolation level that are observed
     * within a successful transaction will observe a consistent snapshot. Changes to the data occurring while a query
     * is evaluated will not affect that query result.
     */
    SNAPSHOT_READ,

    /**
     * Snapshot: in addition to {@link #SNAPSHOT_READ}, successful transactions in this isolation level will operate
     * against a particular dataset snapshot. Transactions in this isolation level will see either the complete effects
     * of other transactions (consistently throughout) or not at all.
     */
    SNAPSHOT,

    /**
     * Serializable: in addition to {@link #SNAPSHOT}, this isolation level requires that all other successful
     * transactions must appear to occur either completely before or completely after a successful serializable
     * transaction.
     */
    SERIALIZABLE;
}