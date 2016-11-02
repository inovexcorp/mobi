package org.matonto.catalog.impl;

import org.matonto.catalog.api.Difference;
import org.matonto.rdf.api.Model;

public class SimpleDifference implements Difference {
    private Model additions;
    private Model deletions;

    @Override
    public Model getAdditions() {
        return additions;
    }

    @Override
    public Model getDeletions() {
        return deletions;
    }

    public static class Builder {
        private Model additions;
        private Model deletions;

        public Builder() {}

        public Builder additions(Model additions) {
            this.additions = additions;
            return this;
        }

        public Builder deletions(Model deletions) {
            this.deletions = deletions;
            return this;
        }

        public SimpleDifference build() {
            return new SimpleDifference(this);
        }
    }

    private SimpleDifference(Builder builder) {
        this.additions = builder.additions;
        this.deletions = builder.deletions;
    }
}
