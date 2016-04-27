package org.matonto.repository.impl.sesame.query;

import org.matonto.query.api.Update;
import org.openrdf.query.UpdateExecutionException;

public class SesameUpdate extends SesameOperation implements Update {

    private org.openrdf.query.Update sesameUpdate;

    public SesameUpdate(org.openrdf.query.Update sesameUpdate) {
        super(sesameUpdate);
        this.sesameUpdate = sesameUpdate;
    }


    @Override
    public void execute() throws UpdateExecutionException {
        try {
            sesameUpdate.execute();
        } catch (org.openrdf.query.UpdateExecutionException e) {
            throw new UpdateExecutionException(e);
        }
    }

    public String toString() {
        return sesameUpdate.toString();
    }
}
