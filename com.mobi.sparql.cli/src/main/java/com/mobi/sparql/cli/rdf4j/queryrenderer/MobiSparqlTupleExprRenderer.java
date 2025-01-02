package com.mobi.sparql.cli.rdf4j.queryrenderer;

/*-
 * #%L
 * com.mobi.sparql.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import org.eclipse.rdf4j.query.algebra.Difference;
import org.eclipse.rdf4j.query.algebra.Filter;
import org.eclipse.rdf4j.query.algebra.Intersection;
import org.eclipse.rdf4j.query.algebra.Join;
import org.eclipse.rdf4j.query.algebra.LeftJoin;
import org.eclipse.rdf4j.query.algebra.StatementPattern;
import org.eclipse.rdf4j.query.algebra.TupleExpr;
import org.eclipse.rdf4j.query.algebra.Union;
import org.eclipse.rdf4j.query.algebra.ValueConstant;
import org.eclipse.rdf4j.query.algebra.ValueExpr;
import org.eclipse.rdf4j.query.algebra.Var;
import org.eclipse.rdf4j.queryrender.BaseTupleExprRenderer;
import org.eclipse.rdf4j.queryrender.RenderUtils;

import java.util.HashMap;
import java.util.Map;

public class MobiSparqlTupleExprRenderer extends BaseTupleExprRenderer {

    private StringBuffer mJoinBuffer = new StringBuffer();

    private Map<TupleExpr, Var> mContexts = new HashMap<>();

    private int mIndent = 2;

    /**
     * @inheritDoc
     */
    @Override
    public void reset() {
        super.reset();

        mJoinBuffer = new StringBuffer();
        mContexts.clear();
    }

    /**
     * @inheritDoc
     */
    @Override
    public String render(final TupleExpr theExpr) throws Exception {
        mContexts = MobiContextCollector.collectContexts(theExpr);

        theExpr.visit(this);

        return mJoinBuffer.toString();
    }

    private String indent() {
        final StringBuilder aBuilder = new StringBuilder();
        for (int i = 0; i < mIndent; i++) {
            aBuilder.append(" ");
        }
        return aBuilder.toString();
    }

    /**
     * @inheritDoc
     */
    @Override
    protected String renderValueExpr(final ValueExpr theExpr) throws Exception {
        return new MobiSparqlValueExprRenderer().render(theExpr);
    }

    private void ctxOpen(TupleExpr theExpr) {
        Var aContext = mContexts.get(theExpr);

        if (aContext != null) {
            mJoinBuffer.append(indent()).append("GRAPH ");
            if (aContext.hasValue()) {
                mJoinBuffer.append(RenderUtils.toSPARQL(aContext.getValue()));
            } else {
                mJoinBuffer.append("?").append(aContext.getName());
            }
            mJoinBuffer.append(" {\n");
            mIndent += 2;
        }
    }

    private void ctxClose(TupleExpr theExpr) {
        Var aContext = mContexts.get(theExpr);

        if (aContext != null) {
            mJoinBuffer.append("}");
            mIndent -= 2;
        }
    }

    /**
     * @inheritDoc
     */
    @Override
    public void meet(Join theJoin) throws Exception {
        ctxOpen(theJoin);

        theJoin.getLeftArg().visit(this);

        theJoin.getRightArg().visit(this);

        ctxClose(theJoin);
    }

    /**
     * @inheritDoc
     */
    @Override
    public void meet(LeftJoin theJoin) throws Exception {
        ctxOpen(theJoin);

        // try and reverse engineer the original scoping intent of the query
        final boolean aNeedsNewScope = theJoin.getParentNode() != null
                && (theJoin.getParentNode() instanceof Join || theJoin.getParentNode() instanceof LeftJoin);

        if (aNeedsNewScope) {
            mJoinBuffer.append("{\n");
        }

        theJoin.getLeftArg().visit(this);

        mJoinBuffer.append(indent()).append("OPTIONAL {\n");

        mIndent += 2;
        theJoin.getRightArg().visit(this);

        if (theJoin.getCondition() != null) {
            mJoinBuffer.append(indent()).append("filter").append(renderValueExpr(theJoin.getCondition())).append("\n");
        }

        mIndent -= 2;

        mJoinBuffer.append(indent()).append("}.\n");

        if (aNeedsNewScope) {
            mJoinBuffer.append("}.\n");
        }

        ctxClose(theJoin);
    }

    /**
     * Renders the tuple expression as a query string. It creates a new MobiSparqlTupleExprRenderer rather than reusing
     * this one.
     *
     * @param theExpr the expr to render
     * @return the rendered expression
     * @throws Exception if there is an error while rendering
     */
    private String renderTupleExpr(TupleExpr theExpr) throws Exception {
        MobiSparqlTupleExprRenderer aRenderer = new MobiSparqlTupleExprRenderer();

        // aRenderer.mProjection = new ArrayList<ProjectionElemList>(mProjection);
        // aRenderer.mDistinct = mDistinct;
        // aRenderer.mReduced = mReduced;
        // aRenderer.mExtensions = new HashMap<String, ValueExpr>(mExtensions);
        // aRenderer.mOrdering = new ArrayList<OrderElem>(mOrdering);
        // aRenderer.mLimit = mLimit;
        // aRenderer.mOffset = mOffset;

        aRenderer.mIndent = mIndent;
        aRenderer.mContexts = new HashMap<>(mContexts);

        return aRenderer.render(theExpr);
    }

    /**
     * @inheritDoc
     */
    @Override
    public void meet(Union theOp) throws Exception {
        ctxOpen(theOp);

        String aLeft = renderTupleExpr(theOp.getLeftArg());
        if (aLeft.endsWith("\n")) {
            aLeft = aLeft.substring(0, aLeft.length() - 1);
        }

        String aRight = renderTupleExpr(theOp.getRightArg());
        if (aRight.endsWith("\n")) {
            aRight = aRight.substring(0, aRight.length() - 1);
        }

        mJoinBuffer.append(indent())
                .append("{\n")
                .append(aLeft)
                .append("\n")
                .append(indent())
                .append("}\n")
                .append(indent())
                .append("union\n")
                .append(indent())
                .append("{\n")
                .append(aRight)
                .append("\n")
                .append(indent())
                .append("}.\n");

        ctxClose(theOp);
    }

    /**
     * @inheritDoc
     */
    @Override
    public void meet(Difference theOp) throws Exception {
        String aLeft = renderTupleExpr(theOp.getLeftArg());
        String aRight = renderTupleExpr(theOp.getRightArg());

        mJoinBuffer.append("\n{")
                .append(aLeft)
                .append("}")
                .append("\nminus\n")
                .append("{")
                .append(aRight)
                .append("}.\n");
    }

    /**
     * @inheritDoc
     */
    @Override
    public void meet(Intersection theOp) throws Exception {
        String aLeft = renderTupleExpr(theOp.getLeftArg());
        String aRight = renderTupleExpr(theOp.getRightArg());

        mJoinBuffer.append("\n")
                .append(aLeft)
                .append("}")
                .append("\nintersection\n")
                .append("{")
                .append(aRight)
                .append("}.\n");
    }

    /**
     * @inheritDoc
     */
    @Override
    public void meet(final Filter theFilter) throws Exception {
        ctxOpen(theFilter);

        if (theFilter.getArg() != null) {
            theFilter.getArg().visit(this);
        }

        // try and reverse engineer the original scoping intent of the query
        final boolean aNeedsNewScope = theFilter.getParentNode() != null
                && (theFilter.getParentNode() instanceof Join || theFilter.getParentNode() instanceof LeftJoin);

        String aFilter = renderValueExpr(theFilter.getCondition());
        if (theFilter.getCondition() instanceof ValueConstant || theFilter.getCondition() instanceof Var) {
            // means the filter is something like "filter (true)" or "filter (?v)"
            // so we'll need to wrap it in parens since they can't live
            // in the query w/o them, but we can't always wrap them in parens in
            // the normal renderer

            aFilter = "(" + aFilter + ")";
        }

        mJoinBuffer.append(indent());

        // if (aNeedsNewScope) {
        // mJoinBuffer.append("{ ");
        // }

        mJoinBuffer.append("filter ").append(aFilter).append(".");

        // if (aNeedsNewScope) {
        // mJoinBuffer.append("}.");
        // }

        mJoinBuffer.append("\n");

        ctxClose(theFilter);
    }

    /**
     * @inheritDoc
     */
    @Override
    public void meet(StatementPattern thePattern) throws Exception {
        ctxOpen(thePattern);

        mJoinBuffer.append(indent()).append(renderPattern(thePattern));

        ctxClose(thePattern);
    }

    String renderPattern(StatementPattern thePattern) throws Exception {
        return renderValueExpr(thePattern.getSubjectVar()) + " " + renderValueExpr(thePattern.getPredicateVar()) + " "
                + "" + renderValueExpr(thePattern.getObjectVar()) + ".\n";

    }
}
