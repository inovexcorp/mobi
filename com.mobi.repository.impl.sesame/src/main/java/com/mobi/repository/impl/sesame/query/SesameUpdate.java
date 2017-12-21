package com.mobi.repository.impl.sesame.query;

/*-
 * #%L
 * com.mobi.repository.impl.sesame
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import com.mobi.query.api.Update;
import org.eclipse.rdf4j.query.UpdateExecutionException;

public class SesameUpdate extends SesameOperation implements Update {

    private org.eclipse.rdf4j.query.Update sesameUpdate;

    public SesameUpdate(org.eclipse.rdf4j.query.Update sesameUpdate) {
        super(sesameUpdate);
        this.sesameUpdate = sesameUpdate;
    }


    @Override
    public void execute() throws UpdateExecutionException {
        try {
            sesameUpdate.execute();
        } catch (org.eclipse.rdf4j.query.UpdateExecutionException e) {
            throw new UpdateExecutionException(e);
        }
    }

    public String toString() {
        return sesameUpdate.toString();
    }
}
